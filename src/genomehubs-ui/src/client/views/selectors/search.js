import { apiUrl, setApiStatus } from "#reducers/api";
import {
  cancelQuery,
  cancelSearch,
  getQueryResultById,
  getSearchDefaults,
  getSearchHistory,
  receiveQuery,
  receiveSearch,
  requestQuery,
  requestSearch,
  setPreferSearchTerm,
  setSearchHistory,
  setSearchIndex,
  setSearchTerm,
} from "#reducers/search";
import { getBasename, pathJoin } from "#reducers/location";
import { resetController, setMessage } from "#reducers/message";

import { checkProgress } from "./checkProgress";
import { getCurrentTaxonomy } from "#reducers/taxonomy";
import { getTypes } from "#reducers/types";
import { nanoid } from "nanoid";
import qs from "#functions/qs";
import { setTreeQuery } from "#reducers/tree";
import store from "#store";

// import { fetchTypes } from "./types";

export function fetchSearchResults(options, navigate) {
  let params = structuredClone(options);
  return async function (dispatch) {
    if (!params.hasOwnProperty("query") || params.query == "") {
      dispatch(cancelSearch);
    }
    const state = store.getState();
    const searchHistory = getSearchHistory(state);
    const taxonomy = getCurrentTaxonomy(state);
    const searchDefaults = getSearchDefaults(state);
    let types = getTypes(state);

    dispatch(setSearchHistory(params));

    let searchTerm = params.query;
    if (!params.hasOwnProperty("result")) {
      params.result = "assembly";
    }
    if (types[params.result]) {
      types = types[params.result];
    }
    if (!params.hasOwnProperty("taxonomy")) {
      params.taxonomy = taxonomy;
    }
    if (
      params.result == "taxon" &&
      !params.query.match(/[\(\)<>=\n\*]/) &&
      !params.query.match(/\s+AND\s+/) &&
      !types[params.query]
    ) {
      if (!params.hasOwnProperty("includeEstimates")) {
        params.includeEstimates = searchDefaults.includeEstimates;
      }
      let taxFilter = searchDefaults.includeDescendants
        ? "tax_tree"
        : "tax_name";
      params.query = `${taxFilter}(${params.query})`;
    }
    // if (!options.hasOwnProperty("summaryValues")) {
    //   options.summaryValues = "count";
    // }
    // dispatch(setSearchIndex(options.result));
    // dispatch(fetchTypes(options.result));
    dispatch(requestSearch());
    dispatch(setSearchTerm(params));
    dispatch(setTreeQuery(null));
    const queryString = qs.stringify(params);
    const endpoint = "search";
    let url = `${apiUrl}/${endpoint}?${queryString}`;
    try {
      let json;
      try {
        const response = await fetch(url);
        json = await response.json();
      } catch (error) {
        json = console.log("An error occured.", error);
      }
      if (!json.results || json.results.length == 0) {
        if (params.result == "taxon" && !searchTerm.match(/[\(\)<>=\n\*]/)) {
          params.query = `tax_name(${searchTerm})`;
          dispatch(setPreferSearchTerm(true));
          dispatch(fetchSearchResults(params, navigate));
        } else if (
          searchTerm.match(/tax_rank/) ||
          searchTerm.match(/tax_depth/)
        ) {
          if (!params.hasOwnProperty("includeEstimates")) {
            params.includeEstimates = true;
            dispatch(setPreferSearchTerm(true));
            dispatch(fetchSearchResults(params, navigate));
          } else {
            dispatch(receiveSearch(json));
          }
        } else {
          dispatch(receiveSearch(json));
        }
      } else {
        dispatch(receiveSearch(json));

        if (navigate) {
          const basename = getBasename();
          let navOptions = { ...params };
          if (json.queryString) {
            navOptions.query = json.queryString;
          }
          navigate(
            `${pathJoin(basename, "search")}?${qs.stringify(navOptions)}`,
            {
              replace: true,
            },
          );
        }
        dispatch(receiveSearch(json));
      }
    } catch (err) {
      dispatch(cancelSearch);
      return dispatch(setApiStatus(false));
    }
  };
}

export function fetchMsearchResults(options, navigate) {
  let params = structuredClone(options);
  return async function (dispatch) {
    const state = store.getState();
    const searchDefaults = getSearchDefaults(state);
    const taxonomy = getCurrentTaxonomy(state);
    const { searches = [], originalQueries = [], result = "taxon" } = params;

    if (!Array.isArray(searches) || searches.length === 0) {
      return dispatch(cancelSearch());
    }

    dispatch(requestSearch());
    dispatch(
      setSearchTerm({
        msearch: true,
        query: params.query, // Preserve query parameter for URL and download
        originalQueries,
        result,
        taxonomy: params.taxonomy || taxonomy,
      }),
    );

    // Normalize searches to ensure all have required fields
    const defaultTaxonFields =
      "taxon_id,scientific_name,taxon_rank,common_names,names";
    const normalizedSearches = searches.map((search) => ({
      query: search.query || "",
      result: search.result || result,
      taxonomy: search.taxonomy || params.taxonomy || taxonomy,
      // Use empty string for fields to get API default behavior (all attribute fields)
      // OR use specific fields if provided. Don't use undefined.
      fields: search.fields !== undefined ? search.fields : params.fields || "",
      limit: parseInt(search.limit, 10) || 1000,
      offset: parseInt(search.offset, 10) || 0,
      // Pass search parameters with each search
      ...(params.includeEstimates !== undefined && {
        includeEstimates: params.includeEstimates,
      }),
      ...(params.includeDescendants !== undefined && {
        includeDescendants: params.includeDescendants,
      }),
      ...(params.includeRawValues !== undefined && {
        includeRawValues: params.includeRawValues,
      }),
      ...(params.excludeAncestral !== undefined && {
        excludeAncestral: params.excludeAncestral,
      }),
      ...(params.excludeDescendant !== undefined && {
        excludeDescendant: params.excludeDescendant,
      }),
      ...(params.excludeDirect !== undefined && {
        excludeDirect: params.excludeDirect,
      }),
      ...(params.excludeMissing !== undefined && {
        excludeMissing: params.excludeMissing,
      }),
      ...(params.sortBy !== undefined && { sortBy: params.sortBy }),
      ...(params.sortOrder !== undefined && { sortOrder: params.sortOrder }),
      ...(params.sortMode !== undefined && { sortMode: params.sortMode }),
    }));

    console.log("Normalized searches:", normalizedSearches);
    console.log("Search defaults:", searchDefaults);

    const endpoint = "msearch";
    const url = `${apiUrl}/${endpoint}`;

    try {
      const requestBody = JSON.stringify({
        searches: normalizedSearches,
      });

      console.log("Sending msearch request:", requestBody);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
      });

      const json = await response.json();

      if (json && json.results) {
        // Transform msearch results into grouped format with UI display limit
        // Flatten results while preserving query grouping metadata
        const allHits = [];
        const queryGroups = [];
        const displayLimit = parseInt(params.displayLimit, 10) || 10; // Default 10 results per group in UI

        originalQueries.forEach((query, idx) => {
          const queryResult = json.results[idx];

          // Handle error results
          if (queryResult && queryResult.status === "error") {
            queryGroups.push({
              query,
              startIndex: allHits.length,
              count: 0,
              totalCount: 0,
              hasMore: false,
              error: queryResult.error,
              errorMessage: `Error: ${queryResult.error}`,
            });
            return;
          }

          // Handle successful results
          if (
            queryResult &&
            queryResult.hits &&
            Array.isArray(queryResult.hits)
          ) {
            const { hits } = queryResult;
            const totalCount = hits.length;
            const displayCount = Math.min(totalCount, displayLimit);
            const hasMore = totalCount > displayLimit;

            queryGroups.push({
              query,
              startIndex: allHits.length,
              count: displayCount,
              totalCount,
              hasMore,
            });
            // Add only displayLimit hits for UI (but track total count for "show more" button)
            hits.slice(0, displayCount).forEach((hit) => {
              allHits.push({
                id: hit.id,
                index: hit.index,
                score: hit.score,
                result: {
                  ...hit.result,
                  // Alias taxon_* fields to expected names for ResultTable
                  names: hit.result.taxon_names || hit.result.names || [],
                },
                _msearchGroup: {
                  query,
                  queryIndex: idx,
                },
              });
            });
          } else {
            // No results (successful query, just no matches)
            queryGroups.push({
              query,
              startIndex: allHits.length,
              count: 0,
              totalCount: 0,
              hasMore: false,
              noResults: true,
            });
          }
        });

        const groupedResults = {
          isMsearch: true,
          originalQueries,
          queryGroups,
          results: allHits,
          displayLimit,
          status: {
            success: true,
            hits: allHits.length, // Required for ResultTable to render
          },
        };

        dispatch(receiveSearch(groupedResults));

        if (navigate) {
          const basename = getBasename();
          const navOptions = {
            query: options.query, // Preserve the batch query string
            result,
            msearch: "true",
            offset: 0,
          };
          navigate(
            `${pathJoin(basename, "search")}?${qs.stringify(navOptions)}`,
            {
              replace: true,
            },
          );
        }
      } else {
        dispatch(receiveSearch(json || { results: [] }));
      }
    } catch (err) {
      console.error("msearch error:", err);
      dispatch(cancelSearch());
      return dispatch(setApiStatus(false));
    }
  };
}

export function fetchQueryResults(queryString) {
  return async function (dispatch) {
    const state = store.getState();
    if (getQueryResultById(state, queryString)) {
      return;
    }
    dispatch(requestQuery());
    const endpoint = "search";
    let url = `${apiUrl}/${endpoint}?${queryString}`;
    try {
      let json;
      try {
        const response = await fetch(url);
        json = await response.json();
      } catch (error) {
        json = console.log("An error occured.", error);
      }
      dispatch(receiveQuery({ json, queryString }));
    } catch (err) {
      dispatch(cancelQuery);
      return dispatch(setApiStatus(false));
    }
  };
}

export const saveSearchResults = ({ options, format = "tsv" }) => {
  return async function (dispatch) {
    const state = store.getState();

    const filename = `download.${format}`;
    options.filename = filename;

    const formats = {
      csv: "text/csv",
      json: "application/json",
      tsv: "text/tab-separated-values",
    };

    // Check if this is a batch search download
    // Detect via searches array OR via originalQueries array (which is set after batch search)
    const hasSearchesArray =
      Array.isArray(options.searches) && options.searches.length > 1;
    const hasOriginalQueries =
      Array.isArray(options.originalQueries) &&
      options.originalQueries.length > 1;
    const isBatchSearch = hasSearchesArray || hasOriginalQueries;

    if (isBatchSearch) {
      // Handle batch search download using new msearch/download endpoint
      try {
        dispatch(
          setMessage({
            message: `Preparing ${format.toUpperCase()} file for download`,
            duration: 0,
            severity: "info",
          }),
        );

        // Build download options with query parameter (already contains batch string)
        const downloadOptions = {
          query: options.query,
          result: options.result,
          taxonomy: options.taxonomy,
          fields: options.fields,
          offset: 0,
          limit: 10000000, // Large limit to get all results
          tidyData: options.tidyData,
          includeRawValues: options.includeRawValues,
          names: options.names,
          ranks: options.ranks,
          filename: filename,
        };

        // Remove undefined values
        Object.keys(downloadOptions).forEach(
          (key) =>
            downloadOptions[key] === undefined && delete downloadOptions[key],
        );

        const queryString = qs.stringify(downloadOptions);
        const url = `${apiUrl}/msearch?${queryString}`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: formats[format],
          },
          signal: window.controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const linkUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = linkUrl;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);

        dispatch(
          setMessage({
            duration: 0,
            severity: "info",
          }),
        );
        return true;
      } catch (err) {
        console.error("Batch download error:", err);
        dispatch(
          setMessage({
            message: `Unable to download ${format.toUpperCase()} file`,
            duration: 5000,
            severity: "error",
          }),
        );
        return false;
      }
    }

    // Original single search download logic
    const queryString = qs.stringify(options);
    const queryId = nanoid(10);
    let url = `${apiUrl}/search?${queryString}&queryId=${queryId}&persist=once`;
    let status;
    const { interval, currentProgress } = checkProgress({
      queryId,
      delay: 2000,
      dispatch,
      message: `Preparing ${format.toUpperCase()} file for download`,
    });
    let maxTries = 50;

    for (let i = 0; i < maxTries; i++) {
      try {
        let response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: formats[format],
          },
          signal: window.controller.signal,
        });
        let { status } = response;
        if (status == 202) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        clearInterval(interval);
        let blob = await response.blob();
        dispatch(
          setMessage({
            duration: 0,
            severity: "info",
          }),
        );
        const linkUrl = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement("a");
        link.href = linkUrl;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        break;
      } catch (err) {
        clearInterval(interval);
        if (window.controller.signal.aborted) {
          dispatch(
            setMessage({
              message: `Cancelled ${format.toUpperCase()} file download`,
              duration: 5000,
              severity: "warning",
            }),
          );
          status = { success: false, error: "Request cancelled" };

          resetController();
          return false;
        }
        let progress = currentProgress();
        if (!progress.uuid) {
          i = maxTries;
        }
        if (i >= maxTries - 1) {
          dispatch(
            setMessage({
              message: `Unable to download ${format.toUpperCase()} file`,
              duration: 5000,
              severity: "error",
            }),
          );
          status = { success: false, error: "Unexpected error" };
          resetController();
          return false;
        }
      }
    }
    dispatch(
      setMessage({
        duration: 0,
        severity: "info",
      }),
    );
    return true;
  };
};
