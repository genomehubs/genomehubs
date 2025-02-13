import { apiUrl, setApiStatus } from "../reducers/api";
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
} from "../reducers/search";
import { resetController, setMessage } from "../reducers/message";

import { basename } from "../reducers/location";
import { checkProgress } from "./checkProgress";
import { getCurrentTaxonomy } from "../reducers/taxonomy";
import { getTypes } from "../reducers/types";
import { nanoid } from "nanoid";
import qs from "../functions/qs";
import { setTreeQuery } from "../reducers/tree";
import store from "../store";

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
          let navOptions = { ...params };
          if (json.queryString) {
            navOptions.query = json.queryString;
          }
          navigate(`${basename}/search?${qs.stringify(navOptions)}`, {
            replace: true,
          });
        }
        dispatch(receiveSearch(json));
      }
    } catch (err) {
      dispatch(cancelSearch);
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
    const queryString = qs.stringify(options);
    const formats = {
      csv: "text/csv",
      json: "application/json",
      tsv: "text/tab-separated-values",
    };
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
