import React, { memo, useEffect, useRef, useState } from "react";

import Autocomplete from "@material-ui/lab/Autocomplete";
import CategoryIcon from "@material-ui/icons/Category";
import EmojiNatureIcon from "@material-ui/icons/EmojiNature";
import ExtensionIcon from "@material-ui/icons/Extension";
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
import { getSuggestedTerm } from "../reducers/search";
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
  return <Popper {...props} placement="bottom" />;
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
        <div>{option.value}</div>
      </Grid>
    </Grid>
  );
};

const AutoCompleteOption = ({ option }) => {
  const classes = useStyles();
  let primaryText, secondaryText;
  let optionIcon = <SearchIcon className={classes.icon} />;
  if (option.result == "taxon") {
    optionIcon = <EmojiNatureIcon className={classes.icon} />;
  } else if (option.result == "assembly") {
    optionIcon = <ExtensionIcon className={classes.icon} />;
  }
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
        {option.value}
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
    if (option.result == "assembly") {
      secondaryText = (
        <Typography variant="body2" color="textSecondary">
          {option.scientific_name}
        </Typography>
      );
    } else {
      secondaryText = (
        <Typography variant="body2" color="textSecondary">
          {option.feature_id}
        </Typography>
      );
    }
  } else if (option.type) {
    optionIcon = <CategoryIcon className={classes.icon} />;
    primaryText = option.unique_term;
    secondaryText = (
      <Typography variant="body2" color="textSecondary">
        {option.type}
      </Typography>
    );
  }

  return (
    <Grid container alignItems="center">
      <Grid item>{optionIcon}</Grid>
      <Grid item xs>
        <div>{primaryText}</div>
        <span style={{ float: "right" }}>
          <Typography variant="body2" color="textSecondary">
            {(option.name_class && option.taxon_id) ||
              option.assembly_id ||
              option.name}
          </Typography>
        </span>
        {secondaryText}
      </Grid>
    </Grid>
  );
};

const siteName = SITENAME || "GenomeHub";

const suggestedTerm = getSuggestedTerm();

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
  synonyms,
}) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const searchBoxRef = useRef(null);
  const searchInputRef = useRef(null);
  let [open, setOpen] = useState(false);
  let [prefix, setPrefix] = useState("");
  let [suffix, setSuffix] = useState("");
  let [subTerm, setSubTerm] = useState("");
  let [multiline, setMultiline] = useState(() => {
    if (searchTerm && searchTerm.query && searchTerm.query.match(/[\r\n]/)) {
      return true;
    }
    return false;
  });

  let terms;
  let options = [];
  // useEffect(() => {
  if (
    lookupTerms.status &&
    lookupTerms.status.success &&
    lookupTerms.results &&
    lookupTerms.results.length > 0
  ) {
    terms = [];
    lookupTerms.results.forEach((result, i) => {
      let value;
      if (result.result.type) {
        let value = result.result.name || result.result.key;
        options.push({
          value,
          name: result.result.display_name,
          type: result.result.type,
          title: `${prefix}${value}${suffix}`,
          prefix,
          subTerm,
          result: result.result.group,
          unique_term: value,
        });
        terms.push(
          <div key={i} className={styles.term}>
            <span className={styles.value}>{result.key}</span>
            <div className={styles.extra}>{`\u2014 ${result.type}`}</div>
          </div>
        );
      } else {
        if (lookupTerms.status.result == "taxon") {
          if (result.reason) {
            value = result.reason[0].fields["taxon_names.name.raw"][0];
          } else {
            value = result.result.scientific_name;
          }
          options.push({
            value,
            title: `${prefix}${value}${suffix}`,
            prefix,
            subTerm,
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
            value,
            title: `${prefix}${value}${suffix}`,
            prefix,
            subTerm,
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
        } else if (lookupTerms.status.result == "feature") {
          if (result.reason) {
            value = result.reason[0].fields["identifiers.identifier.raw"][0];
          } else {
            value = result.result.feature_id;
          }
          options.push({
            value,
            title: `${prefix}${value}${suffix}`,
            prefix,
            subTerm,
            result: "feature",
            unique_term: result.result.feature_id,
            taxon_id: result.result.taxon_id,
            assembly_id: result.result.assembly_id,
            feature_id: result.result.feature_id,
            identifier_class: result.reason
              ? result.reason[0].fields["identifiers.class"]
              : "feature ID",
          });
          terms.push(
            <div key={i} className={styles.term}>
              <span className={styles.value}>{value}</span>
              <div
                className={styles.extra}
              >{`\u2014 ${result.result.primary_type}`}</div>
            </div>
          );
        }
      }
    });
  }
  console.log(options);
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
      if (!types[term] && !synonyms[term]) {
        term = `${taxWrap}(${term})`;
      }
    }
    return term;
  };

  const doSearch = (queryString, result, hashTerm) => {
    let taxWrap = "tax_name";
    if (searchDefaults.includeDescendants) {
      taxWrap = "tax_tree";
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

  const setLastType = (value, lastType, types) => {
    value = value.replace(/\s*$/, "");
    value = value.replace(/^\s*/, "");
    if (value.length == 0) {
      return lastType;
    }
    if (value.match(/(\)|and|AND)/)) {
      return {};
    } else if (value.match(/tax_(eq|lineage|name|tree)/)) {
      return { type: "taxon" };
    } else if (value.match(/tax_rank/)) {
      return { type: "rank" };
    } else if (lastType.name && value.match(/(<|<=|=|!=|>=|>)/)) {
      lastType.operator = value;
      return lastType;
    } else if (types[value]) {
      return types[value];
    }
    return lastType;
  };

  const updateTerm = (value, index, types) => {
    setLookupTerm(value);
    let parts = value.split(/(\s{0,1}(?:<=|!=|>=|[\(\),!<=>]|and|AND)\s{0,1})/);
    let section = 0;
    let newPrefix = "";
    let newSuffix = "";
    let lastType = {};
    if (parts.length > 1) {
      let length = 0;
      for (let i = 0; i < parts.length; i++) {
        let end = length + parts[i].length;
        if (index == end && end == length) {
          newSuffix += parts[i];
          section = i;
        } else if (index >= end) {
          lastType = setLastType(parts[i], lastType, types);
          if (index == end) {
            section = i;
          } else {
            newPrefix += parts[i];
          }
        } else if (index > length) {
          lastType = setLastType(parts[i], lastType, types);
          section = i;
        } else {
          newSuffix += parts[i];
        }
        length = end;
      }
    }
    if (!newSuffix && newPrefix.match(/\(\s*$/)) {
      newSuffix = ")";
    }
    if (parts[section].match(/(<|<=|=|!=|>=|>|[\(\),!]|and|AND)/)) {
      section += 1;
    }
    if (parts[section].match(/\s$/) && !lastType.operator) {
      let bits = parts[section].split(/(\s+)/);
      if (bits.length <= 3 && types[bits[0]]) {
        let bit = bits.shift();
        if (types[bit]) {
          lastType = setLastType(bit, lastType, types);
          newPrefix += bit + bits[0];
          parts[section] = bits.join("");
        }
      }
    }
    setPrefix(newPrefix);
    setSuffix(newSuffix);
    setSubTerm(parts[section]);
    fetchLookup({
      lookupTerm: parts[section],
      taxonomy,
      prefix,
      suffix,
      lastType,
    });
  };

  const highlightRange = (text) => {
    let length = text ? text.length : searchInputRef.current.value.length;
    let end = length;
    end = length - suffix.length;
    console.log({ prefix, suffix });
    return [prefix.length, end];
  };
  const handlePopperClose = (e, reason) => {
    if (e) {
      let range = highlightRange();
      setTimeout(() => {
        searchInputRef.current.setSelectionRange(...range);
      }, 100);
    }
  };
  const handleHighlightChange = (e, option, reason) => {
    if (e && option) {
      let range = highlightRange(option.title);
      setTimeout(() => {
        searchInputRef.current.setSelectionRange(...range);
      }, 100);
    }
  };
  const handleChange = (e, newValue) => {
    if (newValue != lookupTerm) {
      if (!newValue.match(/[\r\n]/)) {
        setMultiline(false);
        updateTerm(newValue, e.target.selectionStart, types);
        setOpen(true);
      } else if (!multiline) {
        updateTerm(newValue, e.target.selectionStart, types);
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
        if (newValue.type || prefix || suffix) {
          setLookupTerm(newValue.title);
        } else {
          setResult(newValue.result);
          doSearch(
            newValue.unique_term || e.target.value,
            newValue.result || "taxon",
            newValue.title || e.target.value
          );
        }
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

  let searchText = `Type to search ${siteName}`;
  if (searchIndex) {
    searchText += ` ${searchIndex} index`;
  }
  if (suggestedTerm) {
    searchText += ` (e.g. ${suggestedTerm})`;
  }
  return (
    <Grid container alignItems="center" direction="column">
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
                  onClose={handlePopperClose}
                  onInputChange={handleChange}
                  onHighlightChange={handleHighlightChange}
                  PopperComponent={PlacedPopper}
                  renderInput={(params) => (
                    <TextField
                      onKeyPress={handleKeyPress}
                      {...params}
                      inputRef={searchInputRef}
                      label={searchText}
                      variant="outlined"
                      // onFocus={(e) => {
                      //   console.log(e.target.value);
                      //   e.target.setSelectionRange(range.start, range.end);
                      // }}
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
