import { apiUrl, setApiStatus } from "../reducers/api";
import {
  cancelFiles,
  getFiles,
  receiveFiles,
  requestFiles,
} from "../reducers/file";

import { createCachedSelector } from "re-reselect";
import { createSelector } from "reselect";
import qs from "qs";

export function fetchFiles(options) {
  return async function (dispatch) {
    if (!options.hasOwnProperty("query")) {
      dispatch(cancelFiles);
    }
    dispatch(requestFiles());
    const queryString = qs.stringify(options);
    let url = `${apiUrl}/search?${queryString}`;
    try {
      let json;
      try {
        const response = await fetch(url);
        json = await response.json();
      } catch (error) {
        json = console.log("An error occured.", error);
      }
      dispatch(receiveFiles(json));
    } catch (err) {
      dispatch(cancelFiles);
      return dispatch(setApiStatus(false));
    }
  };
}

const processFiles = (files, analysisId) => {
  let fileSet = files.byAnalysisId[analysisId];
  if (!fileSet) return undefined;
  return Object.values(fileSet.byId);
};

export const getFilesByAnalysisId = createCachedSelector(
  getFiles,
  (_state, analysisId) => analysisId,
  (files, analysisId) => processFiles(files, analysisId)
)((_state, analysisId) => analysisId);
