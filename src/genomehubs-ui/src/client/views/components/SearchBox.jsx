import React, { memo, useRef, useState } from "react";

import Autocomplete from "@material-ui/lab/Autocomplete";
import FormControl from "@material-ui/core/FormControl";
import Grid from "@material-ui/core/Grid";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import IconButton from "@material-ui/core/IconButton";
import Popper from "@material-ui/core/Popper";
import SearchIcon from "@material-ui/icons/Search";
import SearchToggles from "./SearchToggles";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import { compose } from "recompose";
import { makeStyles } from "@material-ui/core/styles";
import qs from "qs";
import styles from "./Styles.scss";
import { useNavigate } from "@reach/router";
import withLookup from "../hocs/withLookup";
import withSearch from "../hocs/withSearch";
import withSearchDefaults from "../hocs/withSearchDefaults";
import withTaxonomy from "../hocs/withTaxonomy";
import withTypes from "../hocs/withTypes";

const useStyles = makeStyles((theme) => ({
  icon: {
    color: theme.palette.text.secondary,
    marginRight: theme.spacing(2),
  },
  formControl: {
    marginTop: theme.spacing(2),
    minWidth: "600px",
  },
  search: {
    fontSize: "2em",
    marginLeft: theme.spacing(1),
    backgroundColor: "inherit",
  },
}));

const PlacedPopper = (props) => {
  return <Popper {...props} placement="top" />;
};

const AutoCompleteSuggestion = ({ option }) => {
  const classes = useStyles();
  return (
    <Grid container alignItems="center">
      <Grid item>
        <HelpOutlineIcon className={classes.icon} />
      </Grid>
      <Grid item xs>
        <Typography variant="body2" color="textSecondary">
          Did you mean
        </Typography>
        <div>{option.title}</div>
      </Grid>
    </Grid>
  );
};

const AutoCompleteOption = ({ option }) => {
  const classes = useStyles();
  let primaryText, secondaryText;
  if (option.name_class) {
    primaryText = (
      <>
        {option.xref && (
          <div style={{ display: "inline-block" }}>
            <Typography variant="body2" color="textSecondary">
              {`${option.name_class}:`}
            </Typography>
          </div>
        )}
        {option.xref && " "}
        {option.title}
      </>
    );
    secondaryText = (
      <Typography variant="body2" color="textSecondary">
        {option.taxon_rank}
        {option.name_class != "scientific name" &&
          option.name_class != "taxon ID" && (
            <span>: {option.scientific_name}</span>
          )}
      </Typography>
    );
  } else if (option.identifier_class) {
    secondaryText = (
      <Typography variant="body2" color="textSecondary">
        {option.scientific_name}
      </Typography>
    );
  }

  return (
    <Grid container alignItems="center">
      <Grid item>
        <SearchIcon className={classes.icon} />
      </Grid>
      <Grid item xs>
        <div>{primaryText}</div>
        <span style={{ float: "right" }}>
          <Typography variant="body2" color="textSecondary">
            {(option.name_class && option.taxon_id) || option.assembly_id}
          </Typography>
        </span>
        {secondaryText}
      </Grid>
    </Grid>
  );
};

const siteName = SITENAME || "GenomeHub";

const suggestedTerm = SUGGESTED_TERM || undefined;

const SearchBox = ({
  lookupTerm,
  setLookupTerm,
  resetLookup,
  lookupTerms,
  fetchLookup,
  fetchSearchResults,
  setSearchIndex,
  searchDefaults,
  searchIndex,
  searchTerm,
  setPreferSearchTerm,
  taxonomy,
  types,
}) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const searchBoxRef = useRef(null);
  const searchInputRef = useRef(null);
  let [open, setOpen] = useState(false);
  let [multiline, setMultiline] = useState(() => {
    if (searchTerm && searchTerm.query && searchTerm.query.match(/[\r\n]/)) {
      return true;
    }
    return false;
  });
  // let [showOptions, setShowOptions] = useState(false);
  // let [showSettings, setShowSettings] = useState(false);
  let [result, setResult] = useState(searchIndex);
  let fields = searchTerm.fields || searchDefaults.fields;
  let ranks = searchTerm.ranks || searchDefaults.ranks;
  let names = searchTerm.names || searchDefaults.names;
  const dispatchSearch = (options, term) => {
    if (!options.hasOwnProperty("includeEstimates")) {
      options.includeEstimates = searchDefaults.includeEstimates;
    }
    if (!options.hasOwnProperty("summaryValues")) {
      options.summaryValues = "count";
    }
    if (!options.hasOwnProperty("fields")) {
      options.fields = fields;
    }
    if (!options.hasOwnProperty("ranks")) {
      options.ranks = ranks;
    }
    if (!options.hasOwnProperty("names")) {
      options.names = names;
    }
    options.taxonomy = taxonomy;
    fetchSearchResults(options);
    setPreferSearchTerm(false);
    navigate(`/search?${qs.stringify(options)}#${encodeURIComponent(term)}`);
  };

  const wrap_term = ({ term, taxWrap, result }) => {
    if (result && result == "taxon" && !term.match(/[\(\)<>=]/)) {
      if (!types[term]) {
        term = `${taxWrap}(${term})`;
      }
    }
    return term;
  };

  const doSearch = (queryString, result, hashTerm) => {
    let taxWrap = "tax_name";
    if (searchDefaults.includeDescendants) {
      taxWrap = "tax_tree";
      // options.query = query.startsWith("tax_") ? query : `tax_tree(${query})`;
      // term = term.startsWith("tax_") ? term : `tax_tree(${term})`;
    }
    if (!queryString.match("\n")) {
      let query = queryString
        .split(/\s+and\s+/i)
        .map((term) => wrap_term({ term, taxWrap, result }));
      queryString = query.join(" AND ");
      let hash = hashTerm
        .split(/\s+and\s+/i)
        .map((term) => wrap_term({ term, taxWrap, result }));
      hashTerm = hash.join(" AND ");
    }

    setSearchIndex(result);
    dispatchSearch({ query: queryString, result, fields }, hashTerm);
    resetLookup();
  };
  const updateTerm = (value) => {
    setLookupTerm(value);
    fetchLookup({ lookupTerm: value, taxonomy });
  };
  const handleChange = (e, newValue) => {
    if (newValue != lookupTerm) {
      if (!newValue.match(/[\r\n]/)) {
        setMultiline(false);
        updateTerm(newValue);
        setOpen(true);
      } else if (!multiline) {
        updateTerm(newValue);
        setOpen(true);
      }
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        e.preventDefault();
        setMultiline(true);
        setLookupTerm(`${searchInputRef.current.value}\n`);
      } else if (!multiline) {
        handleSubmit(e);
      }
    }
  };
  const handleKeyDown = (e, newValue) => {
    if (e.shiftKey) {
      handleKeyPress(e);
    } else if (newValue) {
      if (newValue.highlighted) {
        setOpen(true);
      } else {
        setOpen(false);
        setResult(newValue.result);
        doSearch(
          newValue.unique_term || e.target.value,
          newValue.result || "taxon",
          newValue.title || e.target.value
        );
      }
    } else {
      resetLookup();
      setMultiline(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let term = searchInputRef.current.value;
    doSearch(term, result, term);
  };

  let terms;
  let options = [];
  if (
    lookupTerms.status &&
    lookupTerms.status.success &&
    lookupTerms.results &&
    lookupTerms.results.length > 0 &&
    !/[\(\)<>=]/.test(lookupTerm)
  ) {
    terms = [];
    lookupTerms.results.forEach((result, i) => {
      let value;
      if (lookupTerms.status.result == "taxon") {
        if (result.reason) {
          value = result.reason[0].fields["taxon_names.name.raw"][0];
        } else {
          value = result.result.scientific_name;
        }
        options.push({
          title: value,
          result: "taxon",
          unique_term: result.result.taxon_id,
          taxon_id: result.result.taxon_id,
          taxon_rank: result.result.taxon_rank,
          scientific_name: result.result.scientific_name,
          name_class: result.reason
            ? result.reason[0].fields["taxon_names.class"]
            : "taxon ID",
          xref: Boolean(
            result.reason &&
              result.reason[0].fields["taxon_names.class"] &&
              !result.reason[0].fields["taxon_names.class"][0].match(" name")
          ),
        });
        terms.push(
          <div key={i} className={styles.term}>
            <span className={styles.value}>{value}</span>
            <div
              className={styles.extra}
            >{`\u2014 ${result.result.taxon_rank}`}</div>
          </div>
        );
      } else if (lookupTerms.status.result == "assembly") {
        if (result.reason) {
          value = result.reason[0].fields["identifiers.identifier.raw"][0];
        } else {
          value = result.result.assembly_id;
        }
        options.push({
          title: value,
          result: "assembly",
          unique_term: result.result.assembly_id,
          taxon_id: result.result.taxon_id,
          scientific_name: result.result.scientific_name,
          assembly_id: result.result.assembly_id,
          identifier_class: result.reason
            ? result.reason[0].fields["identifiers.class"]
            : "assembly ID",
        });
        terms.push(
          <div key={i} className={styles.term}>
            <span className={styles.value}>{value}</span>
            <div
              className={styles.extra}
            >{`\u2014 ${result.result.scientific_name}`}</div>
          </div>
        );
      }
    });
  }
  if (
    lookupTerms.status &&
    lookupTerms.status.success &&
    lookupTerms.suggestions &&
    lookupTerms.suggestions.length > 0 &&
    !/[\(\)<>=]/.test(lookupTerm)
  ) {
    lookupTerms.suggestions.forEach((suggestion, i) => {
      options.push({
        title: suggestion.suggestion.text,
        highlighted: suggestion.suggestion.highlighted,
      });
    });
  }
  let searchText = `Type to search ${siteName}`;
  if (suggestedTerm) {
    searchText += ` (e.g. ${suggestedTerm})`;
  }
  return (
    <Grid
      container
      alignItems="center"
      direction="column"
      // justify="center"
      // alignItems="center"
      // style={{
      //   minHeight: "6em",
      //   minWidth: "600px",
      //   zIndex: 10,
      // }}
    >
      <Grid item>
        <form
          onSubmit={handleSubmit}
          style={{
            minWidth: "900px",
            width: "100%",
          }}
        >
          <Grid container direction="row" alignItems="center">
            <Grid item xs={2}></Grid>
            <Grid item ref={searchBoxRef} xs={"auto"}>
              <FormControl className={classes.formControl}>
                <Autocomplete
                  id="main-search"
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.title
                  }
                  getOptionSelected={(option, value) =>
                    option.title === value.title
                  }
                  options={options}
                  autoComplete
                  includeInputInList
                  freeSolo
                  value={lookupTerm}
                  open={open}
                  onChange={handleKeyDown}
                  onInputChange={handleChange}
                  PopperComponent={PlacedPopper}
                  renderInput={(params) => (
                    <TextField
                      onKeyPress={handleKeyPress}
                      {...params}
                      inputRef={searchInputRef}
                      label={searchText}
                      variant="outlined"
                      fullWidth
                      multiline
                      maxRows={5}
                    />
                  )}
                  renderOption={(option) => {
                    if (option.highlighted) {
                      return <AutoCompleteSuggestion option={option} />;
                    }
                    return <AutoCompleteOption option={option} />;
                  }}
                />
                {/* <FormHelperText
                  labelPlacement="end"
                  onClick={() => {
                    setShowOptions(!showOptions);
                    setShowSettings(false);
                  }}
                  style={{ textAlign: "right", cursor: "pointer" }}
                >
                  {showOptions ? "Hide" : "Show"} search options...
                </FormHelperText> */}
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <Tooltip title="Click to search" arrow placement={"top"}>
                <IconButton
                  className={classes.search}
                  aria-label="submit search"
                  type="submit"
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </form>
      </Grid>
      <Grid container direction="row" alignItems="center">
        <Grid item xs={2}></Grid>
        <Grid item xs={8}>
          <SearchToggles />
        </Grid>
        <Grid item xs={2}></Grid>
      </Grid>
      {/* <Grid container direction="row" alignItems="center">
        <Grid item xs={2}></Grid>
        <Grid item xs={8}>
          <ChipInputAutoSuggest data={suggestions} />
        </Grid>
        <Grid item xs={2}></Grid>
      </Grid> */}
    </Grid>
  );
};

export default compose(
  memo,
  withTaxonomy,
  withTypes,
  withSearch,
  withSearchDefaults,
  withLookup
)(SearchBox);
