import React, { memo, useRef, useState } from "react";
import { useLocation, useNavigate } from "@reach/router";

import { Box } from "@mui/material";
import ChipSearchBox from "./ChipSearch/ChipSearchBox";
import Grid from "@mui/material/Grid2";
import { Template } from "./Markdown";
import { compose } from "recompose";
// import dispatchLiveQuery from "../hocs/dispatchLiveQuery";
import { getSuggestedTerm } from "../reducers/search";
import lookupFunction from "./ChipSearch/functions/lookupFunction";
import qs from "../functions/qs";
import { siteName } from "../reducers/location";
import { useReadLocalStorage } from "usehooks-ts";
import { useStyles } from "./SearchBoxStyles";
import withApi from "../hocs/withApi";
import withLookup from "../hocs/withLookup";
import withSearch from "../hocs/withSearch";
import withSearchDefaults from "../hocs/withSearchDefaults";
import withSiteName from "#hocs/withSiteName";
import withTaxonomy from "../hocs/withTaxonomy";
import withTypes from "../hocs/withTypes";

const suggestedTerm = getSuggestedTerm();

const indexList = ["taxon", "assembly", "sample", "feature"];

const SearchBoxWrapper = ({
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
  apiUrl,

  indices,
  types,
  synonyms,
  basename,
}) => {
  const results = indexList.filter((index) => indices.includes(index));
  const [searchBoxTerm, setSearchBoxTerm] = useState(searchTerm.query || "");
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

  let [result, setResult] = useState(searchIndex);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [liveQuery, setLiveQuery] = useState("");

  let toggleTemplate;

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
      fields = searchOptions?.fields?.join(",") || options.fields || fields;
      ranks = searchOptions?.ranks?.join(",") || options.ranks || ranks;
      names = searchOptions?.names?.join(",") || options.names || names;
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

  const doSearch = ({ query, result, fields, hashTerm = "", ...options }) => {
    console.log("doSearch", query, result, fields, options);
    setSearchIndex(result);

    // let inputs = Array.from(
    //   formRef.current
    //     ? formRef.current.getElementsByClassName("inputQuery")
    //     : [],
    // )
    //   .map((el) => ({
    //     name: el.children[1].children[0].name,
    //     value: el.children[1].children[0].value,
    //   }))
    //   .filter((el) => el.name.match(/query[A-Z]+/) && el.value);
    // let inputQueries = inputs.reduce(
    //   (a, el) => ({ ...a, [el.name]: el.value }),
    //   {},
    // );
    let inputQueries = {};

    // let savedOptions = allOptions[options.result];
    // let fields =
    //   // searchTerm.fields ||
    //   savedOptions?.fields?.join(",") || searchDefaults.fields;

    dispatchSearch(
      { query: query, ...inputQueries, result, fields, ...options },
      query,
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

  const normalizedOptions = { ...options };
  Object.entries(normalizedOptions).forEach(([key, value]) => {
    if (value === "true") {
      normalizedOptions[key] = true;
    } else if (value === "false") {
      normalizedOptions[key] = false;
    }
    if (["fields", "ranks", "names"].includes(key)) {
      normalizedOptions[key] = value.split(",");
    }
  });

  let searchOptions = {
    // ...searchDefaults,
    // ...allOptions[searchIndex],
    ...normalizedOptions,
    result,
  };

  return (
    <Grid container alignItems="center" direction="column" ref={rootRef}>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 2,
          minWidth: "900px",
          width: "100%",
        }}
      >
        <ChipSearchBox
          searchOptions={searchOptions}
          results={results}
          types={types}
          value={searchBoxTerm}
          setValue={setSearchBoxTerm}
          handleSubmit={(searchOptions) => {
            console.log("handleSubmit", searchBoxTerm, searchOptions);
            doSearch({ result, ...searchOptions });
          }}
          lookupFunction={(props) =>
            lookupFunction({ apiUrl, result, taxonomy, ...props })
          }
          //compact
        />
      </Box>
    </Grid>
  );
};

export default compose(
  memo,
  withSiteName,
  withTaxonomy,
  withTypes,
  withApi,
  withSearch,
  withSearchDefaults,
  withLookup,
  // dispatchLiveQuery
)(SearchBoxWrapper);
