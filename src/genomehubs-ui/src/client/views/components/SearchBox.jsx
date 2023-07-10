import React, { memo, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "@reach/router";

import AutoCompleteInput from "./AutoCompleteInput";
import FormControl from "@material-ui/core/FormControl";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Popper from "@material-ui/core/Popper";
import SearchIcon from "@material-ui/icons/Search";
import SearchInputQueries from "./SearchInputQueries";
import SearchToggles from "./SearchToggles";
import Template from "./Template";
import Tooltip from "@material-ui/core/Tooltip";
import { compose } from "recompose";
import dispatchLiveQuery from "../hocs/dispatchLiveQuery";
import { getSuggestedTerm } from "../reducers/search";
import { makeStyles } from "@material-ui/core/styles";
import qs from "../functions/qs";
import { siteName } from "../reducers/location";
import { useReadLocalStorage } from "usehooks-ts";
import withLookup from "../hocs/withLookup";
import withSearch from "../hocs/withSearch";
import withSearchDefaults from "../hocs/withSearchDefaults";
import withSiteName from "../hocs/withSiteName";
import withTaxonomy from "../hocs/withTaxonomy";
import withTypes from "../hocs/withTypes";

export const useStyles = makeStyles((theme) => ({
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

export const PlacedPopper = (props) => {
  return <Popper {...props} placement="bottom" />;
};

const suggestedTerm = getSuggestedTerm();

const SearchBox = ({
  lookupTerm,
  setLookupTerm,
  // resetLookup,
  fetchSearchResults,
  setSearchIndex,
  searchDefaults,
  searchIndex,
  searchTerm,
  setPreferSearchTerm,
  taxonomy,
  types,
  synonyms,
  basename,
  setLiveQuery,
}) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  let options = qs.parse(location.search.replace(/^\?/, ""));
  const formRef = useRef(null);
  const searchBoxRef = useRef(null);
  const searchInputRef = useRef(null);
  const savedOptions = useReadLocalStorage(`${searchIndex}Options`);
  let [multiline, setMultiline] = useState(() => {
    if (searchTerm && searchTerm.query && searchTerm.query.match(/[\r\n]/)) {
      return true;
    }
    return false;
  });
  let [result, setResult] = useState(searchIndex);
  const [showSearchBox, setShowSearchBox] = useState(false);

  let toggleTemplate;
  if (options && options.searchTemplate) {
    // Show search template
    let templateProps = {};
    for (let [key, val] of Object.entries(options)) {
      if (key.match(/value[A-Z]/)) {
        templateProps[key] = val;
      }
    }
    if (!showSearchBox) {
      return (
        <Template
          id={options.searchTemplate}
          {...options}
          toggleFunction={() => setShowSearchBox(!showSearchBox)}
        />
      );
    }
    toggleTemplate = (e) => setShowSearchBox(!showSearchBox);
  }

  let fields =
    searchTerm.fields ||
    savedOptions?.fields?.join(",") ||
    searchDefaults.fields;
  let ranks =
    searchTerm.ranks || savedOptions?.ranks?.join(",") || searchDefaults.ranks;
  let names =
    searchTerm.names || savedOptions?.names?.join(",") || searchDefaults.names;

  const dispatchSearch = (searchOptions, term) => {
    let options = { ...searchTerm, ...searchOptions };
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
    if (!options.size && savedOptions?.size) {
      options.size = savedOptions.size;
    }
    if (savedOptions) {
      if (savedOptions.sortBy && !options.sortBy) {
        options.sortBy = savedOptions.sortBy;
        options.sortOrder = savedOptions.sortOrder || "asc";
      }
      ["Ancestral", "Descendant", "Direct", "Missing"].forEach((key) => {
        let keyName = `exclude${key}`;
        if (
          savedOptions.hasOwnProperty(keyName) &&
          !options.hasOwnProperty(keyName)
        )
          options[keyName] = savedOptions[keyName];
      });
    }
    fetchSearchResults(options);
    setPreferSearchTerm(false);
    navigate(
      `${basename}/search?${qs.stringify(options)}#${encodeURIComponent(term)}`
    );
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
    setLookupTerm(queryString);
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

    let inputs = Array.from(
      formRef.current
        ? formRef.current.getElementsByClassName("inputQuery")
        : []
    )
      .map((el) => ({
        name: el.children[1].children[0].name,
        value: el.children[1].children[0].value,
      }))
      .filter((el) => el.name.match(/query[A-Z]+/) && el.value);
    let inputQueries = inputs.reduce(
      (a, el) => ({ ...a, [el.name]: el.value }),
      {}
    );
    dispatchSearch(
      { query: queryString, ...inputQueries, result, fields },
      hashTerm
    );
    // resetLookup();
  };

  const handleSubmit = (e, props = {}) => {
    e && e.preventDefault();
    const { index } = props;
    let term = searchInputRef.current.value;
    doSearch(term, index || result, term);
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
      <form
        onSubmit={handleSubmit}
        ref={formRef}
        style={{
          minWidth: "900px",
          width: "100%",
        }}
      >
        <SearchInputQueries />
        <Grid item>
          <Grid container direction="row" alignItems="center">
            <Grid item xs={2}></Grid>
            <Grid item ref={searchBoxRef} xs={"auto"}>
              <FormControl className={classes.formControl}>
                <AutoCompleteInput
                  inputValue={lookupTerm}
                  setInputValue={setLookupTerm}
                  inputRef={searchInputRef}
                  inputLabel={searchText}
                  inputName={"query"}
                  multiline={multiline}
                  setMultiline={setMultiline}
                  handleSubmit={handleSubmit}
                  doSearch={doSearch}
                  setLiveQuery={setLiveQuery}
                  result={result}
                  multipart={true}
                />
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <Tooltip title="Click to search" arrow placement={"top"}>
                <IconButton
                  className={classes.search}
                  aria-label="submit search"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setTimeout(() => {
                      formRef.current.dispatchEvent(
                        new Event("submit", {
                          cancelable: false,
                          bubbles: true,
                        })
                      );
                    }, 20);
                  }}
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Grid>
      </form>
      <Grid container direction="row" alignItems="center">
        <Grid item xs={2}></Grid>
        <Grid item xs={8}>
          <SearchToggles toggleTemplate={toggleTemplate} />
        </Grid>
        <Grid item xs={2}></Grid>
      </Grid>
    </Grid>
  );
};

export default compose(
  memo,
  withSiteName,
  withTaxonomy,
  withTypes,
  withSearch,
  withSearchDefaults,
  withLookup,
  dispatchLiveQuery
)(SearchBox);
