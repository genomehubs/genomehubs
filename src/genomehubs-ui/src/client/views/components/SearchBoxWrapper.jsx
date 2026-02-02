import { memo, useRef, useState } from "react";

import { Box } from "@mui/material";
import ChipSearchBox from "./ChipSearch/ChipSearchBox";
import Grid from "@mui/material/Grid";
import { compose } from "redux";
import { getSuggestedTerm } from "#reducers/search";
import lookupFunction from "./ChipSearch/functions/lookupFunction";
import qs from "#functions/qs";
import { siteName } from "#reducers/location";
import { useLocation } from "@reach/router";
import useNavigate from "#hooks/useNavigate";
import { useReadLocalStorage } from "usehooks-ts";
import { useStyles } from "./SearchBoxStyles";
import withApi from "#hocs/withApi";
import withLookup from "#hocs/withLookup";
import withSearch from "#hocs/withSearch";
import withSearchDefaults from "#hocs/withSearchDefaults";
import withSiteName from "#hocs/withSiteName";
import withTaxonomy from "#hocs/withTaxonomy";
import withTypes from "#hocs/withTypes";

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
  allTypes,
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

  const resetSearch = () => {
    setSearchIndex("taxon");
    setSearchBoxTerm("");
    setLookupTerm("");
    fetchSearchResults({ result: "taxon", query: "" });
    setPreferSearchTerm(false);
    navigate(`/${pathname}`);
  };

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

    // Build URL params - exclude searches array, keep query for batch or single search
    const urlParams = { ...fullOptions };
    delete urlParams.searches; // Don't persist searches array in URL
    delete urlParams.originalQueries; // Don't persist originalQueries in URL

    console.log("dispatchSearch - fullOptions:", fullOptions);
    console.log("dispatchSearch - urlParams before stringify:", urlParams);
    console.log("dispatchSearch - query in urlParams?", !!urlParams.query);

    const queryString = qs.stringify(urlParams);
    console.log("dispatchSearch - final query string:", queryString);

    if (pathname.match(/^search/)) {
      navigate(`/${pathname}?${queryString}#${encodeURIComponent(term)}`);
    } else {
      navigate(`/search?${queryString}#${encodeURIComponent(term)}`);
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

  const doSearch = ({
    query,
    result,
    fields,
    hashTerm = "",
    includeDescendants,
    ...options
  }) => {
    setSearchIndex(result);

    if (query && typeof includeDescendants !== "undefined") {
      if (includeDescendants) {
        query = query.replace(/tax_(name|eq)/, "tax_tree");
      } else {
        query = query.replace(/tax_tree/, "tax_name");
      }
    }

    // Check if this is a multi-query input for batch search
    // Must match the delimiter configuration in SearchBox
    const BATCH_SEARCH_DELIMITER = "semicolon";
    let delimiter =
      BATCH_SEARCH_DELIMITER === "comma"
        ? /[,]/
        : BATCH_SEARCH_DELIMITER === "semicolon"
          ? /[;]/
          : /\n/;
    let hasDelimiter = query && query.match(delimiter);
    let queries = [];

    if (hasDelimiter) {
      // Split by configured delimiter
      queries = query
        .split(delimiter)
        .map((q) => q.trim())
        .filter((q) => q.length > 0);
    }

    // Only proceed with batch search if multiple queries
    if (queries.length > 1) {
      // Wrap each individual query term properly
      let taxWrap = "tax_name";
      if (searchDefaults.includeDescendants) {
        taxWrap = "tax_tree";
      }

      const searches = queries.map((q) => {
        // Only wrap in tax_name/tax_tree if it's a bare term (no special chars, not an attribute)
        let wrappedQuery = q;
        if (!q.match(/[\(\)<>=]/) && !types[q] && !synonyms[q]) {
          wrappedQuery = `${taxWrap}(${q})`;
        }
        return {
          query: wrappedQuery,
          result,
          taxonomy: taxonomy,
          fields: fields || "",
          limit: parseInt(options.limit || 1000, 10),
          offset: parseInt(options.offset || 0, 10),
        };
      });

      // Create grouped batch search with dispatchSearch routing to batch
      console.log("doSearch - detected batch search, queries:", queries);
      console.log("doSearch - passing to dispatchSearch with query:", query);
      dispatchSearch(
        {
          searches,
          originalQueries: queries,
          query: query, // Include full query string for URL preservation
          result,
          taxonomy: options.taxonomy || searchTerm.taxonomy || taxonomy,
          fields,
          ...options,
        },
        query,
      );
      return;
    }

    dispatchSearch({ query, result, fields, ...options }, query);
    // resetLookup();
  };

  const handleSubmit = (e, props = {}) => {
    e && e.preventDefault();
    const { index } = props;
    let term = searchInputRef.current.value;
    doSearch(term, index || result, term);
  };

  let searchText = `Search ${siteName}`;
  if (searchIndex) {
    searchText += ` ${searchIndex} index`;
  }
  if (suggestedTerm) {
    searchText += ` (e.g. ${suggestedTerm})`;
  }

  const normalizedOptions = {
    ...(typeof searchTerm === "object" ? searchTerm : {}),
    ...options,
  };
  Object.entries(normalizedOptions).forEach(([key, value]) => {
    if (value === "true") {
      normalizedOptions[key] = true;
    } else if (value === "false") {
      normalizedOptions[key] = false;
    }
    if (["fields", "ranks", "names"].includes(key) && value) {
      normalizedOptions[key] = value.split(",");
    }
    if (key.match(/query[A-Z]/)) {
      let result, query, fields;
      if (typeof value === "string") {
        if (value.includes("--")) {
          [result, query, fields] = value.split("--");
          fields = fields?.split(",") || [];
        } else {
          query = value;
          fields = [];
        }
      } else {
        ({ result, query, fields } = value);
      }
      if (query) {
        normalizedOptions[key] = {
          query,
          result,
          fields,
        };
      }
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
          allTypes={allTypes}
          placeholder={searchText}
          value={searchBoxTerm}
          setValue={setSearchBoxTerm}
          handleSubmit={(searchOptions) => {
            doSearch({ result, ...searchOptions, offset: 0 });
          }}
          lookupFunction={(props) =>
            lookupFunction({ apiUrl, result, taxonomy, ...props })
          }
          resetSearch={resetSearch}
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
