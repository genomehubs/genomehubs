import React, { memo, useState } from "react";
import { Theme, createStyles, makeStyles } from "@material-ui/core/styles";
import { useLocation, useNavigate } from "@reach/router";

import CancelIcon from "@material-ui/icons/Cancel";
import Checkbox from "@material-ui/core/Checkbox";
import Chip from "@material-ui/core/Chip";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Grid from "@material-ui/core/Grid";
import InputLabel from "@material-ui/core/InputLabel";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import ListItemText from "@material-ui/core/ListItemText";
import MenuItem from "@material-ui/core/MenuItem";
import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionDetails from "@material-ui/core/AccordionDetails";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import Paper from "@material-ui/core/Paper";
import Select from "@material-ui/core/Select";
import SettingsButton from "./SettingsButton";
import Tooltip from "@material-ui/core/Tooltip";
import { compose } from "recompose";
import qs from "../functions/qs";
import { useLocalStorage } from "usehooks-ts";
import withNames from "../hocs/withNames";
import withRanks from "../hocs/withRanks";
import withSearch from "../hocs/withSearch";
import withSiteName from "../hocs/withSiteName";
import { withStyles } from "@material-ui/core/styles";
import withTaxonomy from "../hocs/withTaxonomy";
import withTypes from "../hocs/withTypes";

const useStyles = makeStyles((theme) => ({
  paper: {
    width: "100%",
    minWidth: "600px",
    padding: theme.spacing(1),
    marginTop: theme.spacing(1),
    border: "none",
    boxShadow: "none",
    overflowX: "hidden",
  },
  root: {
    width: "100%",
  },
  formControl: {
    margin: theme.spacing(2),
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
  redBackground: {
    backgroundColor: "#C00",
    padding: 10,
  },
  whiteBackground: {
    backgroundColor: "#FFF",
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 240,
    maxWidth: 480,
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
  },
  chip: {
    margin: 2,
    backgroundColor: "#FFF",
  },
  noLabel: {
    marginTop: theme.spacing(3),
  },
}));

const Accordion = withStyles({
  root: {
    border: "1px solid rgba(0, 0, 0, .125)",
    boxShadow: "none",
    "&:not(:last-child)": {
      borderBottom: 0,
    },
    "&:before": {
      display: "none",
    },
    "&$expanded": {
      margin: "auto",
    },
  },
  expanded: {},
})(MuiAccordion);

const AccordionSummary = withStyles({
  root: {
    borderBottom: "1px solid rgba(0, 0, 0, .125)",
    marginBottom: -1,
    minHeight: "1em",
    "&$expanded": {
      minHeight: "1em",
    },
    padding: "0 1em",
  },
  content: {
    margin: "3px 0",
    "&$expanded": {
      margin: "3px 0",
    },
  },
  expanded: {},
})(MuiAccordionSummary);

const AccordionDetails = withStyles((theme) => ({
  root: {
    padding: "0 1em",
  },
}))(MuiAccordionDetails);

const SearchSettings = ({
  searchTerm,
  setTaxonomy,
  taxonomy,
  taxonomies,
  hashTerm,
  searchResults,
  fetchSearchResults,
  setPreferSearchTerm,
  searchIndex,
  types,
  displayRanks,
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
    {}
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
    searchTerm.fields.split(",").forEach((field) => {
      let [f, s = "value"] = field.split(":");
      if (!fieldSets[f]) {
        fieldSets[f] = [];
      }
      fieldSets[f].push(s);
    });
    let newFields = [];
    for (let field of fields) {
      if (fieldSets[field]) {
        for (let subset of fieldSets[field]) {
          newFields.push(subset == "value" ? field : `${field}:${subset}`);
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
    navigate(
      `${basename}/search?${qs.stringify(options)}${location.hash || ""}`
    );
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
    navigate(
      `${basename}/search?${qs.stringify(options)}${location.hash || ""}`
    );
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
        // activeChips.push(
        //   <Chip
        //     key={id}
        //     label={id}
        //     clickable
        //     className={classes.chip}
        //     onDelete={(e) => handleChange(e, id, key)}
        //   />
        // );
      }
      if (group[id].description) {
        content.push(
          <Tooltip
            key={id}
            title={group[id].description}
            arrow
            placement={"top"}
          >
            <MenuItem value={id} onClick={(e) => handleChange(e, id, key)}>
              <Checkbox color={"default"} checked={state[id]} />
              {label}
            </MenuItem>
          </Tooltip>
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
          </MenuItem>
        );
      }
    });
    let checked = state[`group-${key}`] == totals[key];
    let indeterminate =
      state[`group-${key}`] > 0 && state[`group-${key}`] < totals[key];
    content.unshift(
      <Tooltip
        key={`all_${key}`}
        title={`Toggle selection for all ${key} attributes`}
        arrow
        placement={"top"}
      >
        <MenuItem
          value={key}
          onClick={(e) => handleGroupChange(e, key, checked)}
        >
          <Checkbox
            color={"default"}
            checked={checked}
            indeterminate={indeterminate}
          />
          all
        </MenuItem>
      </Tooltip>
    );
    groups.push(
      <Grid item key={key}>
        <FormControl className={classes.formControl}>
          <InputLabel id="demo-mutiple-chip-checkbox-label">{key}</InputLabel>
          <Select
            labelId="demo-mutiple-chip-checkbox-label"
            id="demo-mutiple-chip-checkbox"
            multiple
            value={checkedList}
            // onChange={handleChange}
            //input={<Input />}
            // MenuProps={MenuProps}
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
        {/* <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-label="Expand"
            aria-controls={`${key}-content`}
            id={`${key}-header`}
          >
            <FormControlLabel
              aria-label={`${key}`}
              onClick={(e) => handleGroupChange(e, key, checked)}
              onFocus={(e) => e.stopPropagation()}
              control={
                <Checkbox
                  color="default"
                  checked={checked}
                  indeterminate={indeterminate}
                />
              }
              label={key}
            />
          </AccordionSummary>
          <AccordionDetails>
            <Grid container justifyContent="flex-start" direction="column">
              {content}
            </Grid>
          </AccordionDetails>
        </Accordion> */}
      </Grid>
    );
  });

  let taxonomyValues = {};
  taxonomies.forEach((taxonomy) => {
    taxonomyValues[taxonomy.toUpperCase()] = taxonomy;
  });

  return (
    <Paper className={classes.paper}>
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
        {/* <Grid container alignItems="flex-end" direction="row" spacing={2}>
          {activeChips}
        </Grid> */}
      </Grid>
    </Paper>
  );
};

export default compose(
  memo,
  withSiteName,
  withTypes,
  withTaxonomy,
  withSearch,
  withRanks,
  withNames
)(SearchSettings);
