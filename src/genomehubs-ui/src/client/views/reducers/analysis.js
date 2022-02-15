import { createAction, handleAction, handleActions } from "redux-actions";

import { createCachedSelector } from "re-reselect";
import { createSelector } from "reselect";
import immutableUpdate from "immutable-update";
import qs from "qs";

export const requestAnalyses = createAction("REQUEST_ANALYSES");
export const receiveAnalyses = createAction(
  "RECEIVE_ANALYSES",
  (json) => json,
  () => ({ receivedAt: Date.now() })
);
export const cancelAnalyses = createAction("CANCEL_ANALYSES");
export const resetAnalyses = createAction("RESET_ANALYSES");

const defaultState = () => ({
  isFetching: false,
  status: {},
  byId: {},
  allIds: [],
  byAssemblyId: { byId: {}, allIds: [] },
  byTaxonId: { byId: {}, allIds: [] },
});

const analyses = handleActions(
  {
    REQUEST_ANALYSES: (state, action) =>
      immutableUpdate(state, {
        isFetching: true,
      }),
    CANCEL_ANALYSES: (state, action) =>
      immutableUpdate(state, {
        isFetching: false,
      }),
    RECEIVE_ANALYSES: (state, action) => {
      let byAnalysisId = { byId: {}, allIds: [] };
      let byAssemblyId = {};
      let byTaxonId = {};
      action.payload.results.forEach((result) => {
        let analysisId = result.result.analysis_id;
        let assemblyId = result.result.assembly_id;
        if (assemblyId) {
          if (!Array.isArray(assemblyId)) {
            assemblyId = [assemblyId];
          }
          assemblyId.forEach((id) => {
            if (!byAssemblyId[id]) {
              byAssemblyId[id] = {
                byId: {},
                allIds: [],
                status: action.payload.status,
              };
            }
            if (!byAssemblyId[id].byId[analysisId]) {
              byAssemblyId[id].allIds.push(analysisId);
            }
            byAssemblyId[id].byId[analysisId] = result.result;
          });
        }
        let taxonId = result.result.taxon_id;
        if (taxonId) {
          if (!Array.isArray(taxonId)) {
            taxonId = [taxonId];
          }
          taxonId.forEach((id) => {
            if (!byTaxonId[id]) {
              byTaxonId[id] = {
                byId: {},
                allIds: [],
                status: action.payload.status,
              };
            }
            if (!byTaxonId[id].byId[analysisId]) {
              byTaxonId[id].allIds.push(analysisId);
            }
            byTaxonId[id].byId[analysisId] = result.result;
          });
        }
        if (!byAnalysisId.byId[analysisId]) {
          byAnalysisId.allIds.push(analysisId);
        }
        byAnalysisId.byId[analysisId] = result.result;
      });
      return immutableUpdate(state, {
        isFetching: false,
        byId: byAnalysisId.byId,
        allIds: byAnalysisId.allIds,
        byAssemblyId,
        byTaxonId,
        // lastUpdated: action.meta.receivedAt,
      });
      // return {
      //   isFetching: false,
      //   status: action.payload.status,
      //   byId,
      //   allIds,
      //   byAssemblyId,
      //   byTaxonId,
      //   lastUpdated: action.meta.receivedAt,
      // };
    },
    RESET_ANALYSES: defaultState,
  },
  defaultState()
);

export const getAnalyses = (state) => state.analyses;

// export const getSearchResultArray = createSelector(
//   getSearchResults,
//   (results) => {
//     if (!results.status || !results.status.success || !results.results) {
//       return [];
//     }
//     let arr = [];
//     results.results.forEach((result) => {
//       let obj = { id: result.id, ...result.result };
//       if (obj.fields) {
//         obj.fields = Object.keys(obj.fields).map((key) => ({
//           id: key,
//           ...obj.fields[key],
//         }));
//       }

//       arr.push(obj);
//     });
//     return arr;
//   }
// );

// export const getAnalysisById = createCachedSelector(
//   getSearchResultArray,
//   (_state, searchId) => searchId,
//   (results, searchId) => {
//     return results.find((result) => result.taxon_id === searchId);
//   }
// )((_state, searchId) => searchId);

export const logAnalysisQuery = createAction("LOG_ANALYSIS_QUERY");
export const analysisQueries = handleAction(
  "LOG_ANALYSIS_QUERY",
  (state, action) => {
    return immutableUpdate(state, {
      [action.payload]: true,
      // lastUpdated: action.meta.receivedAt,
    });
  },
  {}
);
export const getAnalysisQueries = (state) => state.analysisQueries;

export const analysisReducers = {
  analyses,
  analysisQueries,
};
