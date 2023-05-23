import { apiUrl, setApiStatus } from "../reducers/api";
import {
  cancelAnalyses,
  getAnalyses,
  logAnalysisQuery,
  receiveAnalyses,
  requestAnalyses,
} from "../reducers/analysis";

import { createCachedSelector } from "re-reselect";
import { createSelector } from "reselect";
import qs from "../functions/qs";

export function fetchAnalyses(options) {
  return async function (dispatch) {
    if (!options.hasOwnProperty("query")) {
      dispatch(cancelAnalyses);
    }
    dispatch(requestAnalyses());
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
      json.options = options;
      dispatch(logAnalysisQuery(queryString));
      dispatch(receiveAnalyses(json));
      // dispatch(setApiStatus(true));
    } catch (err) {
      dispatch(cancelAnalyses);
      return dispatch(setApiStatus(false));
    }
  };
}

// const processAnalysesByAssemblyId = (analyses, assemblyId) => {
//   let analysisSet = analyses.byAssemblyId[assemblyId];
//   if (!analysisSet) return undefined;
//   return Object.values(analysisSet.byId);
// };

// export const getAnalysesByAssemblyId = createCachedSelector(
//   getAnalyses,
//   (_state, assemblyId) => assemblyId,
//   (analyses, assemblyId) => processAnalysesByAssemblyId(analyses, assemblyId)
// )((_state, assemblyId) => assemblyId);

const processAnalysesByAssemblyId = (analyses, assemblyId) => {
  let analysisSet = analyses.byAssemblyId[assemblyId];
  if (!analysisSet) return undefined;
  return Object.values(analysisSet.byId);
};

export const getAnalysesByAssemblyId = createSelector(
  getAnalyses,
  (_state, assemblyId) => assemblyId,
  (analyses, assemblyId) => processAnalysesByAssemblyId(analyses, assemblyId)
);

// const processAnalysesByTaxonId = (analyses, taxonId) => {
//   let analysisSet = analyses.byTaxonId[taxonId];
//   if (!analysisSet) return undefined;
//   return Object.values(analysisSet).byId;
// };

// export const getAnalysesByTaxonId = createCachedSelector(
//   getAnalyses,
//   (_state, taxonId) => taxonId,
//   (analyses, taxonId) => processAnalysesByTaxonId(analyses, taxonId)
// )((_state, taxonId) => taxonId);

const processAnalysesByTaxonId = (analyses, taxonId) => {
  let analysisSet = analyses.byTaxonId[taxonId];
  if (!analysisSet) return undefined;
  return Object.values(analysisSet.byId);
};

export const getAnalysesByTaxonId = createSelector(
  getAnalyses,
  (_state, taxonId) => taxonId,
  (analyses, taxonId) => processAnalysesByTaxonId(analyses, taxonId)
);

const processAnalysisById = (analyses, analysisId) => {
  let analysis = analyses.byId[analysisId];
  if (!analysis) return undefined;
  return Object.values(analysis);
};

export const getAnalysisById = createCachedSelector(
  getAnalyses,
  (_state, analysisId) => analysisId,
  (analyses, analysisId) => processAnalysisById(analyses, analysisId)
)((_state, analysisId) => analysisId);
