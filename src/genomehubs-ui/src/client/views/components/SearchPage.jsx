import { memo, useEffect } from "react";

import Page from "./Page";
import ReportPanel from "./ReportPanel";
import ResultTable from "./ResultTable";
import TextPanel from "./TextPanel";
import { compose } from "redux";
import dispatchLookup from "#hocs/dispatchLookup";
import equal from "deep-equal";
import qs from "#functions/qs";
import shallow from "shallowequal";
import { useLocation } from "@reach/router";
import useNavigate from "#hooks/useNavigate";
import withSearch from "#hocs/withSearch";
import withSearchDefaults from "#hocs/dispatchSearchDefaults";

// Configuration for batch search delimiter (must match SearchBox.jsx)
const BATCH_SEARCH_DELIMITER = "semicolon";

const SearchPage = ({
  searchResults,
  searchResultArray,
  setLookupTerm,
  // lookupTerm,
  searchTerm,
  setSearchTerm,
  setSearchIndex,
  preferSearchTerm,
  previousSearchTerm,
  setPreviousSearchTerm,
  fetchSearchResults,
  searchDefaults,
  setSearchDefaults,
  topLevel,
  pageId = "search.md",
  searchIndex,
}) => {
  let results = [];
  const navigate = useNavigate();
  const location = useLocation();
  let options = qs.parse(location.search.replace(/^\?/, ""));
  if (options.ranks && Array.isArray(options.ranks)) {
    options.ranks = options.ranks.join(",");
  }
  let hashTerm = decodeURIComponent(location.hash.replace(/^\#/, ""));

  // Detect and convert batch queries from URL parameter
  if (options.query && typeof options.query === "string") {
    const delimiter =
      BATCH_SEARCH_DELIMITER === "comma"
        ? /[,;\n]/
        : BATCH_SEARCH_DELIMITER === "semicolon"
          ? /[;\n]/
          : /\n/;
    const hasDelimiter = options.query.match(delimiter);

    if (hasDelimiter) {
      const queries = options.query
        .split(delimiter)
        .map((q) => q.trim())
        .filter((q) => q.length > 0);

      if (queries.length > 1) {
        // Convert to batch search format
        // The selector (fetchMsearchResults) will fill in defaults for taxonomy, fields, etc.
        const searches = queries.map((query) => ({
          query: query.match(/[\(\)<>=]/) ? query : `tax_name(${query})`,
          result: options.result || "taxon",
        }));

        // Mark this as a batch search in options
        // Keep all other options (taxonomy, fields, limit, offset, etc.)
        options.searches = searches;
        options.originalQueries = queries;
      }
    }
  }

  let { isFetching } = searchResults;
  let values = JSON.stringify(Object.values(options));
  useEffect(() => {
    if (!isFetching) {
      if ((options.query || options.searches) && !equal(options, searchTerm)) {
        let newDefaults = {
          includeEstimates: !(
            options.hasOwnProperty("includeEstimates") &&
            String(options.includeEstimates) == "false"
          ),
          includeDescendants: Boolean(
            options.query && options.query.match("tax_tree"),
          ),
          emptyColumns:
            options.hasOwnProperty("emptyColumns") &&
            String(options.emptyColumns) == "true",
        };
        if (!shallow(searchDefaults, newDefaults)) {
          setSearchDefaults(newDefaults);
        }
        // Add defaults to options so they're passed to fetchSearchResults
        if (!options.hasOwnProperty("includeEstimates")) {
          options.includeEstimates = newDefaults.includeEstimates;
        }
        if (!options.hasOwnProperty("includeDescendants")) {
          options.includeDescendants = newDefaults.includeDescendants;
        }
        if (!options.hasOwnProperty("emptyColumns")) {
          options.emptyColumns = newDefaults.emptyColumns;
        }
        if (preferSearchTerm) {
          if (!equal(searchTerm, previousSearchTerm)) {
            setPreviousSearchTerm(searchTerm);
            setSearchIndex(options.result);
            // Set query parameter in searchTerm for proper URL reconstruction
            setSearchTerm({ ...searchTerm, query: options.query });
            // Set the lookup term to show in search box
            setLookupTerm(options.query || hashTerm);
            // Pass options (which includes searches array from batch detection) to fetchSearchResults
            fetchSearchResults(options);
          }
        } else if (Object.keys(previousSearchTerm).length > 0) {
          let hashedNav = (path) => {
            path = path.replace(
              /\/search\b/,
              `${location.pathname.replace(basename, "")}`,
            );
            let to = path;
            let from = `${location.pathname}?${qs.stringify(
              previousSearchTerm,
            )}`;
          };
          if (!equal(options, previousSearchTerm)) {
            setPreviousSearchTerm(options);
            setSearchIndex(options.result);
            // Set query parameter in searchTerm for proper URL reconstruction
            setSearchTerm({ ...options, query: options.query });
            // Set the lookup term to show in search box
            setLookupTerm(options.query || hashTerm);
            fetchSearchResults(options, hashedNav);
          }
        } else {
          let hashedNav = (path) => {
            // TODO: include taxonomy
            path = path.replace(/\/search\b/, `${location.pathname}`);
            navigate(`${path}#${encodeURIComponent(hashTerm)}`);
          };
          setPreviousSearchTerm(options);
          setSearchIndex(options.result);
          // Set query parameter in searchTerm for proper URL reconstruction
          setSearchTerm({ ...options, query: options.query });
          // Set the lookup term to show in search box - use query param or hash
          setLookupTerm(options.query || hashTerm);
          fetchSearchResults(options, hashedNav);
        }
      } else if (searchTerm.query && !options.query) {
        setPreviousSearchTerm({});
        setSearchTerm({});
        // setSearchIndex("taxon");
        fetchSearchResults({});
      }
    }
  }, [values, hashTerm, isFetching]);
  let text = <TextPanel pageId={pageId}></TextPanel>;

  if (!searchTerm || searchTerm == "") {
    // return null;
  }

  let resultCount = searchResults.isFetching
    ? -1
    : searchResults.status
      ? searchResults.status.hits
      : 0;
  if (resultCount > 0 || (options && options.query)) {
    results = <ResultTable />;
  } else {
    results = null;
  }
  let uniqueCount;
  if (resultCount > 0 && searchResults.isMsearch) {
    console.log(searchResults);
    ({ uniqueCount = 0 } = searchResults);
  }

  let report;
  if (searchResultArray.length > 0) {
    report = <ReportPanel options={options} />;
  }

  if (topLevel) {
    return <Page panels={[{ panel: results, maxWidth: "100%" }]} />;
  }

  return (
    <Page
      searchBox
      panels={[
        { panel: results, maxWidth: "100%" },
        { panel: report },
        { panel: text },
      ]}
      resultCount={resultCount}
      uniqueCount={uniqueCount}
    />
  );
};

export default compose(
  memo,
  dispatchLookup,
  withSearchDefaults,
  withSearch,
)(SearchPage);
