import React, { memo, useRef, useState } from "react";
import { useLocation, useNavigate } from "@reach/router";

import AutoCompleteInput from "./AutoCompleteInput";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import SearchButton from "./SearchButton";
import SearchInputQueries from "./SearchInputQueries";
import SearchToggles from "./SearchToggles";
import { Template } from "./Markdown";
import { compose } from "redux";
// import dispatchLiveQuery from "../hocs/dispatchLiveQuery";
import { getSuggestedTerm } from "../reducers/search";
import qs from "../functions/qs";
import { siteName } from "../reducers/location";
import { useReadLocalStorage } from "usehooks-ts";
import { useStyles } from "./SearchBoxStyles";
import withLookup from "../hocs/withLookup";
import withSearch from "../hocs/withSearch";
import withSearchDefaults from "../hocs/withSearchDefaults";
import withSiteName from "#hocs/withSiteName";
import withTaxonomy from "../hocs/withTaxonomy";
import withTypes from "../hocs/withTypes";

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
}) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  let options = qs.parse(location.search.replace(/^\?/, ""));
  let pathname = location.pathname.replace(/^\//, "");
  const formRef = useRef(null);
  const searchBoxRef = useRef(null);
  const rootRef = useRef(null);
  const searchInputRef = useRef(null);

  const allOptions = {
    taxon: useReadLocalStorage(`taxonOptions`) || {},
    assembly: useReadLocalStorage(`assemblyOptions`) || {},
    sample: useReadLocalStorage(`sampleOptions`) || {},
    feature: useReadLocalStorage(`featureOptions`) || {},
  };
  let [multiline, setMultiline] = useState(() => {
    if (searchTerm && searchTerm.query && searchTerm.query.match(/[\r\n]/)) {
      return true;
    }
    return false;
  });
  let [result, setResult] = useState(searchIndex);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [liveQuery, setLiveQuery] = useState("");

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

  const dispatchSearch = (searchOptions = {}, term) => {
    let sameIndex = searchIndex == searchOptions.result;
    let fullOptions = { ...searchTerm, ...searchOptions };
    if (!fullOptions.hasOwnProperty("includeEstimates")) {
      fullOptions.includeEstimates = searchDefaults.includeEstimates;
    }

    let savedOptions = allOptions[options.result];

    let fields = savedOptions?.fields?.join(",") || searchDefaults.fields;
    let ranks = savedOptions?.ranks?.join(",") || searchDefaults.ranks;
    let names = savedOptions?.names?.join(",") || searchDefaults.names;

    if (sameIndex) {
      fields = options.fields || fields;
      ranks = options.ranks || ranks;
      names = options.names || names;
    }

    // if (
    //   !fullOptions.hasOwnProperty("fields") ||
    //   searchTerm.result != searchOptions.result
    // ) {
    fullOptions.fields = fields;
    // }
    // if (
    //   !fullOptions.hasOwnProperty("ranks") ||
    //   searchTerm.result != searchOptions.result
    // ) {
    fullOptions.ranks = ranks;
    // }
    // if (
    //   !fullOptions.hasOwnProperty("names") ||
    //   searchTerm.result != searchOptions.result
    // ) {
    fullOptions.names = names;
    // }

    fullOptions.taxonomy = taxonomy;
    if (!fullOptions.size && savedOptions?.size) {
      fullOptions.size = savedOptions.size;
    }
    if (savedOptions) {
      if (savedOptions.sortBy && !fullOptions.sortBy) {
        fullOptions.sortBy = savedOptions.sortBy;
        fullOptions.sortOrder = savedOptions.sortOrder || "asc";
      }
      ["Ancestral", "Descendant", "Direct", "Missing"].forEach((key) => {
        let keyName = `exclude${key}`;
        if (
          savedOptions.hasOwnProperty(keyName) &&
          !fullOptions.hasOwnProperty(keyName)
        ) {
          fullOptions[keyName] = savedOptions[keyName];
        }
      });
    }
    fetchSearchResults(fullOptions);
    setPreferSearchTerm(false);
    if (pathname.match(/^search/)) {
      navigate(
        `${basename}/${pathname}?${qs.stringify(fullOptions)}#${encodeURIComponent(term)}`,
      );
    } else {
      navigate(
        `${basename}/search?${qs.stringify(fullOptions)}#${encodeURIComponent(term)}`,
      );
    }
  };

  const wrapTerm = ({ term, taxWrap, result }) => {
    if (
      result &&
      result == "taxon" &&
      !term.match(/[\(\)<>=]/) &&
      !types[term] &&
      !synonyms[term] &&
      term > ""
    ) {
      term = `${taxWrap}(${term})`;
    }
    return term;
  };

  const doSearch = (queryString, result, hashTerm) => {
    // setLookupTerm(queryString);
    if (lookupTerm != queryString) {
      setLookupTerm(queryString);
    }
    let taxWrap = "tax_name";
    if (searchDefaults.includeDescendants) {
      taxWrap = "tax_tree";
    }
    if (!queryString.match("\n")) {
      let query = queryString
        .split(/\s+and\s+/i)
        .map((term) => wrapTerm({ term, taxWrap, result }));
      queryString = query.join(" AND ");
      let hash = hashTerm
        .split(/\s+and\s+/i)
        .map((term) => wrapTerm({ term, taxWrap, result }));
      hashTerm = hash.join(" AND ");
    }
    setSearchIndex(result);

    let inputs = Array.from(
      formRef.current
        ? formRef.current.getElementsByClassName("inputQuery")
        : [],
    )
      .map((el) => ({
        name: el.children[1].children[0].name,
        value: el.children[1].children[0].value,
      }))
      .filter((el) => el.name.match(/query[A-Z]+/) && el.value);
    let inputQueries = inputs.reduce(
      (a, el) => ({ ...a, [el.name]: el.value }),
      {},
    );

    let savedOptions = allOptions[options.result];
    let fields =
      // searchTerm.fields ||
      savedOptions?.fields?.join(",") || searchDefaults.fields;
    dispatchSearch(
      { query: queryString, ...inputQueries, result, fields },
      hashTerm,
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
    <Grid container alignItems="center" direction="column" ref={rootRef}>
      <form
        onSubmit={handleSubmit}
        ref={formRef}
        style={{
          minWidth: "900px",
          width: "100%",
        }}
      >
        <SearchInputQueries liveQuery={liveQuery} />
        <Grid>
          <Grid container direction="row" alignItems="center">
            <Grid size={2}></Grid>
            <Grid ref={searchBoxRef} size={8}>
              <FormControl
                variant="standard"
                className={classes.formControl}
                style={{
                  width: "100%",
                }}
              >
                <AutoCompleteInput
                  inputValue={lookupTerm}
                  setInputValue={setLookupTerm}
                  handleBlur={() => {}}
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
            <Grid size={2}>
              {/* <Tooltip title="Click to search" arrow placement={"top"}> */}
              {/* <IconButton
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
                </IconButton> */}
              <SearchButton
                handleClick={(e, props) => {
                  e.preventDefault();
                  handleSubmit(e, props);
                  // setTimeout(() => {
                  //   formRef.current.dispatchEvent(
                  //     new Event("submit", {
                  //       cancelable: false,
                  //       bubbles: true,
                  //     })
                  //   );
                  // }, 20);
                }}
              />
              {/* </Tooltip> */}
            </Grid>
          </Grid>
        </Grid>
      </form>
      {/* <Grid
        container
        direction="row"
        alignItems="center"
        // style={{ paddingBottom: "1em" }}
      > */}
      <Grid size={1}></Grid>
      <Grid size={10}>
        <SearchToggles toggleTemplate={toggleTemplate} id="searchToggles" />
      </Grid>
      <Grid size={1}></Grid>
      {/* </Grid> */}
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
  // dispatchLiveQuery
)(SearchBox);
