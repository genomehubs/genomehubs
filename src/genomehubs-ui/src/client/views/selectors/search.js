import { apiUrl, setApiStatus } from "../reducers/api";
import {
  cancelSearch,
  getSearchDefaults,
  getSearchHistory,
  receiveSearch,
  requestSearch,
  setPreferSearchTerm,
  setSearchHistory,
  setSearchIndex,
  setSearchTerm,
} from "../reducers/search";
import {
  getController,
  resetController,
  setMessage,
} from "../reducers/message";

import { basename } from "../reducers/location";
import { checkProgress } from "./checkProgress";
import { getCurrentTaxonomy } from "../reducers/taxonomy";
import { nanoid } from "nanoid";
import qs from "../functions/qs";
import { setTreeQuery } from "../reducers/tree";
import store from "../store";

// import { fetchTypes } from "./types";

export function fetchSearchResults(options, navigate) {
  return async function (dispatch) {
    if (!options.hasOwnProperty("query")) {
      dispatch(cancelSearch);
    }
    const state = store.getState();
    const searchHistory = getSearchHistory(state);
    const taxonomy = getCurrentTaxonomy(state);
    const searchDefaults = getSearchDefaults(state);

    dispatch(setSearchHistory(options));

    let searchTerm = options.query;
    if (!options.hasOwnProperty("result")) {
      options.result = "assembly";
    }
    if (!options.hasOwnProperty("taxonomy")) {
      options.taxonomy = taxonomy;
    }
    if (options.result == "taxon" && !options.query.match(/[\(\)<>=\n\*]/)) {
      if (!options.hasOwnProperty("includeEstimates")) {
        options.includeEstimates = searchDefaults.includeEstimates;
      }
      let taxFilter = searchDefaults.includeDescendants
        ? "tax_tree"
        : "tax_name";
      options.query = `${taxFilter}(${options.query})`;
    }
    // if (!options.hasOwnProperty("summaryValues")) {
    //   options.summaryValues = "count";
    // }
    // dispatch(setSearchIndex(options.result));
    // dispatch(fetchTypes(options.result));
    dispatch(requestSearch());
    dispatch(setSearchTerm(options));
    dispatch(setTreeQuery(null));
    const queryString = qs.stringify(options);
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
        if (!searchTerm.match(/[\(\)<>=\n\*]/)) {
          options.query = `tax_name(${searchTerm})`;
          dispatch(setPreferSearchTerm(true));
          dispatch(fetchSearchResults(options, navigate));
          // } else if (searchTerm.match(/tax_tree/)) {
          //   options.query = searchTerm.replace("tax_tree", "tax_name");

          //   dispatch(setPreferSearchTerm(true));
          //   dispatch(fetchSearchResults(options, navigate));
        } else if (
          searchTerm.match(/tax_rank/) ||
          searchTerm.match(/tax_depth/)
        ) {
          if (!options.hasOwnProperty("includeEstimates")) {
            options.includeEstimates = true;
            dispatch(setPreferSearchTerm(true));
            dispatch(fetchSearchResults(options, navigate));
          } else {
            dispatch(receiveSearch(json));
          }
        } else {
          dispatch(receiveSearch(json));
        }
      } else {
        dispatch(receiveSearch(json));

        if (navigate) {
          let navOptions = { ...options };
          if (json.queryString) {
            navOptions.query = json.queryString;
          }
          navigate(`${basename}/search?${qs.stringify(navOptions)}`, {
            replace: true,
          });
        }
        dispatch(receiveSearch(json));
        // dispatch(setApiStatus(true));
      }
    } catch (err) {
      dispatch(cancelSearch);
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
    let url = `${apiUrl}/search?${queryString}&queryId=${queryId}`;
    let status;
    const interval = checkProgress({
      queryId,
      delay: 1000,
      dispatch,
      message: `Preparing ${format.toUpperCase()} file for download`,
    });

    try {
      let response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: formats[format],
        },
        signal: getController(state).signal,
      });
      clearInterval(interval);
      let blob = await response.blob();
      dispatch(
        setMessage({
          duration: 0,
          severity: "info",
        })
      );
      const linkUrl = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = linkUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      clearInterval(interval);
      if (getController(state).signal.aborted) {
        dispatch(
          setMessage({
            message: `Cancelled ${format.toUpperCase()} file download`,
            duration: 5000,
            severity: "warning",
          })
        );
        status = { success: false, error: "Request cancelled" };
      } else {
        dispatch(
          setMessage({
            message: `Unable to download ${format.toUpperCase()} file`,
            duration: 5000,
            severity: "error",
          })
        );
        status = { success: false, error: "Unexpected error" };
        console.log(error);
      }
      dispatch(resetController());
      return false;
    }
    dispatch(
      setMessage({
        duration: 0,
        severity: "info",
      })
    );
    return true;
  };
};
