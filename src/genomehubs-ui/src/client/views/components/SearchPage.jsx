import React, { memo, useEffect } from "react";
import { useLocation, useNavigate } from "@reach/router";

import Page from "./Page";
import ReportPanel from "./ReportPanel";
import ResultTable from "./ResultTable";
import TextPanel from "./TextPanel";
import { compose } from "recompose";
import dispatchLookup from "../hocs/dispatchLookup";
import equal from "deep-equal";
import qs from "../functions/qs";
import shallow from "shallowequal";
import withSearch from "../hocs/withSearch";
import withSearchDefaults from "../hocs/dispatchSearchDefaults";

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
  let { isFetching } = searchResults;
  let values = JSON.stringify(Object.values(options));
  useEffect(() => {
    if (!isFetching) {
      if (options.query && !equal(options, searchTerm)) {
        let newDefaults = {
          includeEstimates: !(
            options.hasOwnProperty("includeEstimates") &&
            String(options.includeEstimates) == "false"
          ),
          includeDescendants: Boolean(options.query.match("tax_tree")),
          emptyColumns:
            options.hasOwnProperty("emptyColumns") &&
            String(options.emptyColumns) == "true",
        };
        if (!shallow(searchDefaults, newDefaults)) {
          setSearchDefaults(newDefaults);
        }
        if (preferSearchTerm) {
          if (!equal(searchTerm, previousSearchTerm)) {
            setPreviousSearchTerm(searchTerm);
            setSearchIndex(options.result);
            setLookupTerm(hashTerm || options.query);
            fetchSearchResults(searchTerm);
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
            setLookupTerm(hashTerm || options.query);
            fetchSearchResults(options, hashedNav);
          }
        } else {
          let hashedNav = (path) => {
            // TODO: include taxonomy
            path = path.replace(
              /\/search\b/,
              `${location.pathname.replace(basename, "")}`,
            );
            navigate(`${path}#${encodeURIComponent(hashTerm)}`);
          };
          setPreviousSearchTerm(options);
          setSearchIndex(options.result);
          setLookupTerm(hashTerm || options.query);
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
    />
  );
};

export default compose(
  memo,
  dispatchLookup,
  withSearchDefaults,
  withSearch,
)(SearchPage);
