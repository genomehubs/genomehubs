import React, { memo, useEffect } from "react";
import { useLocation, useNavigate } from "@reach/router";

import Page from "./Page";
import ReportPanel from "./ReportPanel";
import ResultTable from "./ResultTable";
import SearchSummary from "./SearchSummary";
import TextPanel from "./TextPanel";
import classnames from "classnames";
import { compose } from "recompose";
import dispatchLookup from "../hocs/dispatchLookup";
import equal from "deep-equal";
import qs from "../functions/qs";
import shallow from "shallowequal";
import styles from "./Styles.scss";
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
  let isFetching = searchResults.isFetching;
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
        };
        if (!shallow(searchDefaults, newDefaults)) {
          setSearchDefaults(newDefaults);
        }
        if (preferSearchTerm) {
          if (!equal(searchTerm, previousSearchTerm)) {
            setPreviousSearchTerm(searchTerm);
            setSearchIndex(options.result);
            setLookupTerm(hashTerm);
            fetchSearchResults(searchTerm);
          }
        } else {
          if (Object.keys(previousSearchTerm).length > 0) {
            let hashedNav = (path) => {
              path = path.replace(/\/search\b/, `${location.pathname}`);
              let to = path;
              let from = `${location.pathname}?${qs.stringify(
                previousSearchTerm
              )}`;
            };
            if (!equal(options, previousSearchTerm)) {
              setPreviousSearchTerm(options);
              setSearchIndex(options.result);
              setLookupTerm(hashTerm);
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
            setLookupTerm(hashTerm);
            fetchSearchResults(options, hashedNav);
          }
        }
      } else if (searchTerm.query && !options.query) {
        setPreviousSearchTerm({});
        setSearchTerm({});
        // setSearchIndex("taxon");
        fetchSearchResults({});
      }
    }
  }, [values, hashTerm, isFetching]);
  let text = <TextPanel pageId={"search.md"}></TextPanel>;

  if (!searchTerm || searchTerm == "") {
    // return null;
  }

  let resultCount = searchResults.isFetching ? -1 : searchResults.status.hits;
  results = <ResultTable />;
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
  withSearch
)(SearchPage);
