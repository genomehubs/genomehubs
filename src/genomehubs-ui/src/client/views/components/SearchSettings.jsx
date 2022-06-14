import React, { memo, useState } from "react";
import { useLocation, useNavigate } from "@reach/router";

import Checkbox from "@material-ui/core/Checkbox";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Grid from "@material-ui/core/Grid";
import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionDetails from "@material-ui/core/AccordionDetails";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import Paper from "@material-ui/core/Paper";
import SettingsButton from "./SettingsButton";
import Tooltip from "@material-ui/core/Tooltip";
import { compose } from "recompose";
import { makeStyles } from "@material-ui/core/styles";
import qs from "qs";
import { useLocalStorage } from "usehooks-ts";
import withNames from "../hocs/withNames";
import withRanks from "../hocs/withRanks";
import withSearch from "../hocs/withSearch";
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

    let options = {
      ...searchTerm,
      result: index,
      offset: 0,
      fields: fields.length > 0 ? fields.join(",") : "none",
      names: names.join(","),
      ranks: ranks.join(","),
      taxonomy: state.taxonomy,
    };
    setPreferSearchTerm(false);
    navigate(`/search?${qs.stringify(options)}${location.hash || ""}`);
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
    navigate(`/search?${qs.stringify(options)}${location.hash || ""}`);
  };

  let groups = [];
  let totals = {};
  Object.keys(groupedTypes).forEach((key) => {
    let group = groupedTypes[key];
    let content = [];
    totals[key] = 0;
    Object.keys(group).forEach((id) => {
      totals[key]++;
      let label = <div>{id}</div>;
      if (group[id].description) {
        label = (
          <Tooltip title={group[id].description} arrow placement={"top"}>
            {label}
          </Tooltip>
        );
      }
      content.push(
        <Grid container alignItems="center" direction="row" key={id}>
          <Grid item>
            <FormControlLabel
              aria-label={`Item ${id}`}
              onClick={(e) => handleChange(e, id, key)}
              onFocus={(e) => e.stopPropagation()}
              control={
                <Checkbox color="default" name={id} checked={state[id]} />
              }
              label={label}
            />
          </Grid>
        </Grid>
      );
    });
    let checked = state[`group-${key}`] == totals[key];
    let indeterminate =
      state[`group-${key}`] > 0 && state[`group-${key}`] < totals[key];
    groups.push(
      <Grid item key={key}>
        <Accordion>
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
        </Accordion>
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
        <Grid container alignItems="center" direction="row" spacing={2}></Grid>
        <Grid container alignItems="flex-start" direction="row" spacing={2}>
          {groups}
        </Grid>

        <Grid container alignItems="flex-start" direction="row" spacing={2}>
          <SettingsButton
            handleClick={handleClick}
            handleResetClick={handleResetClick}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default compose(
  memo,
  withTypes,
  withTaxonomy,
  withSearch,
  withRanks,
  withNames
)(SearchSettings);
