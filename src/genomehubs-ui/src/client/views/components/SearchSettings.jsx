import React, { memo, useState } from "react";

import Box from "@mui/material/Box";
import CancelIcon from "@mui/icons-material/Cancel";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import SettingsButton from "./SettingsButton";
import Tooltip from "./Tooltip";
import { compose } from "redux";
import makeStyles from "@mui/styles/makeStyles";
import qs from "#functions/qs";
import { useLocalStorage } from "usehooks-ts";
import { useLocation } from "@reach/router";
import useNavigate from "#hooks/useNavigate";
import withNames from "#hocs/withNames";
import withRanks from "#hocs/withRanks";
import withSearch from "#hocs/withSearch";
import withSiteName from "#hocs/withSiteName";
import withTaxonomy from "#hocs/withTaxonomy";
import withTypes from "#hocs/withTypes";

const useStyles = makeStyles((theme) => ({
  paper: {
    width: "100%",
    minWidth: "600px",
    padding: "8px",
    marginTop: "8px",
    border: "none",
    boxShadow: "none",
    overflowX: "visible",
  },
  root: {
    width: "100%",
  },
  selectEmpty: {
    marginTop: "16px",
  },
  redBackground: {
    backgroundColor: "#C00",
    padding: "10px",
  },
  whiteBackground: {
    backgroundColor: "#FFF",
  },
  formControl: {
    margin: "8px",
    minWidth: "240px",
    maxWidth: "480px",
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
  },
  chip: {
    margin: "2px",
    backgroundColor: "#FFF",
  },
  noLabel: {
    marginTop: "24px",
  },
}));

const SearchSettings = ({
  searchTerm,
  taxonomy,
  taxonomies,
  setPreferSearchTerm,
  searchIndex,
  types,
  taxonomyRanks,
  nameClasses,
  groupedTypes,
  basename,
}) => {
  const [state, setState] = React.useState(() => {
    let initialState = { taxonomy };
    Object.keys(groupedTypes).forEach((key) => {
      let group = groupedTypes[key];
      initialState[`group-${key}`] = 0;
      Object.keys(group).forEach((id) => {
        let active = group[id].active == true;
        initialState[id] = active;
        if (active) {
          initialState[`group-${key}`] += 1;
        }
      });
    });
    return initialState;
  });
  let index = searchIndex;

  const [savedOptions, setSavedOptions] = useLocalStorage(
    `${searchIndex}Options`,
    {},
  );

  const handleTaxonomyChange = (e) => {
    e.stopPropagation();
    setState({
      ...state,
      taxonomy: e.target.value,
    });
    // setTaxonomy(e.target.value);
  };

  const handleGroupChange = (event, group, checked) => {
    event.stopPropagation();
    let newState = {};
    let sum = 0;
    Object.keys(groupedTypes[group]).forEach((id) => {
      newState[id] = !checked;
      sum++;
    });
    newState[`group-${group}`] = checked ? 0 : sum;
    setState({
      ...state,
      ...newState,
    });
  };

  const handleChange = (event, name, group) => {
    event.stopPropagation();
    let sum = state[`group-${group}`] + (state[name] ? -1 : 1);
    setState({
      ...state,
      [name]: !state[name],
      [`group-${group}`]: sum,
    });
  };
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    let fields = [];
    let names = [];
    let ranks = [];
    Object.keys(state).forEach((key) => {
      if (state[key] === true) {
        if (taxonomyRanks[key]) {
          ranks.push(key);
        } else if (nameClasses[key]) {
          names.push(key);
        } else {
          fields.push(key);
        }
      }
    });
    let fieldSets = {};
    let newFields = [];
    for (let field of fields) {
      if (fieldSets[field]) {
        for (let subset of fieldSets[field]) {
          newFields.push(
            subset == types[field].processed_simple
              ? field
              : `${field}:${subset}`,
          );
        }
      } else {
        newFields.push(field);
      }
    }
    let options = {
      ...searchTerm,
      result: index,
      offset: 0,
      fields: newFields.length > 0 ? newFields.join(",") : "none",
      names: names.join(","),
      ranks: ranks.join(","),
      taxonomy: state.taxonomy,
    };
    setPreferSearchTerm(false);
    navigate(`search?${qs.stringify(options)}${location.hash || ""}`);
  };

  const handleResetClick = () => {
    let options = {
      ...searchTerm,
      taxonomy,
      offset: 0,
    };
    delete options.fields;
    delete options.names;
    delete options.ranks;
    delete options.offset;
    delete options.pageSize;
    delete options.excludeAncestral;
    delete options.excludeDescendant;
    delete options.excludeDirect;
    delete options.excludeMissing;
    setPreferSearchTerm(false);
    setSavedOptions({});
    navigate(`search?${qs.stringify(options)}${location.hash || ""}`);
  };

  let groups = [];
  let totals = {};
  // let activeChips = [];
  Object.keys(groupedTypes).forEach((key) => {
    let group = groupedTypes[key];
    let checkedList = [];
    let content = [];
    totals[key] = 0;
    Object.keys(group).forEach((id) => {
      totals[key]++;
      let label = <ListItemText primary={id} />;

      if (state[id]) {
        checkedList.push(id);
      }
      if (group[id].description) {
        content.push(
          <Tooltip
            key={id}
            title={group[id].description}
            arrow
            placement={"top"}
          >
            <div>
              <MenuItem value={id} onClick={(e) => handleChange(e, id, key)}>
                <Checkbox color={"default"} checked={state[id]} />
                {label}
              </MenuItem>
            </div>
          </Tooltip>,
        );
      } else {
        content.push(
          <MenuItem
            key={id}
            value={id}
            onClick={(e) => handleChange(e, id, key)}
          >
            <Checkbox color={"default"} checked={state[id]} />
            {label}
          </MenuItem>,
        );
      }
    });
    let checked = state[`group-${key}`] == totals[key];
    let indeterminate =
      state[`group-${key}`] > 0 && state[`group-${key}`] < totals[key];
    groups.push(
      <Grid key={key}>
        <FormControl
          variant="standard"
          className={classes.formControl}
          style={{ marginLeft: "1em" }}
        >
          <InputLabel
            id="demo-mutiple-chip-checkbox-label"
            sx={{
              marginTop: checkedList.length > 0 ? 0 : "-1em",
              overflow: "visible",
            }}
          >
            <Checkbox
              color={"default"}
              checked={checked}
              indeterminate={indeterminate}
              style={{ marginLeft: "-1.5em" }}
              onClick={(e) => handleGroupChange(e, key, checked)}
            />
            {key}
          </InputLabel>
          <Select
            variant="standard"
            labelId="demo-mutiple-chip-checkbox-label"
            id="demo-mutiple-chip-checkbox"
            multiple
            sx={{ minWidth: "240px" }}
            value={checkedList}
            IconComponent={KeyboardArrowDownIcon}
            renderValue={(selected) => (
              <div className={classes.chips}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    label={value}
                    clickable
                    deleteIcon={
                      <CancelIcon
                        onMouseDown={(event) => event.stopPropagation()}
                      />
                    }
                    className={classes.chip}
                    onDelete={(e) => handleChange(e, value, key)}
                  />
                ))}
              </div>
            )}
          >
            {content}
          </Select>
        </FormControl>
      </Grid>,
    );
  });

  let taxonomyValues = {};
  taxonomies.forEach((taxonomy) => {
    taxonomyValues[taxonomy.toUpperCase()] = taxonomy;
  });

  return (
    <Box className={classes.paper}>
      <Grid container alignItems="center" direction="column">
        {/* <Grid container alignItems="center" direction="row" spacing={2}></Grid> */}
        <Grid container alignItems="flex-end" direction="row" spacing={2}>
          {groups}
        </Grid>

        <Grid container alignItems="flex-end" direction="row" spacing={2}>
          <SettingsButton
            handleClick={handleClick}
            handleResetClick={handleResetClick}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default compose(
  memo,
  withSiteName,
  withTypes,
  withTaxonomy,
  withSearch,
  withRanks,
  withNames,
)(SearchSettings);
