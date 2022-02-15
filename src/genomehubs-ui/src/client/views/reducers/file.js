import { createAction, handleAction, handleActions } from "redux-actions";

import { createCachedSelector } from "re-reselect";
import { createSelector } from "reselect";
import { fetchSearchResults } from "../selectors/search";
import immutableUpdate from "immutable-update";
import qs from "qs";

export const requestFiles = createAction("REQUEST_FILES");
export const receiveFiles = createAction(
  "RECEIVE_FILES",
  (json) => json,
  () => ({ receivedAt: Date.now() })
);
export const cancelFiles = createAction("CANCEL_FILES");
export const resetFiles = createAction("RESET_FILES");

const defaultState = () => ({
  isFetching: false,
  byAnalysisId: {},
});

const files = handleActions(
  {
    REQUEST_FILES: (state, action) =>
      immutableUpdate(state, {
        isFetching: true,
      }),
    CANCEL_FILES: (state, action) =>
      immutableUpdate(state, {
        isFetching: false,
      }),
    RECEIVE_FILES: (state, action) => {
      let byAnalysisId = {};
      action.payload.results.forEach((result) => {
        let analysis_id = result.result.analysis_id;
        if (!byAnalysisId[analysis_id]) {
          byAnalysisId[analysis_id] = {
            byId: {},
            allIds: [],
            status: action.payload.status,
          };
        }
        let file_id = result.result.file_id;
        if (!byAnalysisId[analysis_id].byId[file_id]) {
          byAnalysisId[analysis_id].allIds.push(file_id);
        }
        byAnalysisId[analysis_id].byId[file_id] = result.result;
      });
      // action.payload.results.forEach((result) => {
      //   byId[result.result.analysis_id] = result.result;
      //   allIds.push(result.result.analysis_id);
      // });
      return immutableUpdate(state, {
        isFetching: false,
        byAnalysisId: { ...state.byAnalysisId, ...byAnalysisId },
        // lastUpdated: action.meta.receivedAt,
      });
      // return {
      //   isFetching: false,
      //   status: action.payload.status,
      //   byId,
      //   allIds,
      //   lastUpdated: action.meta.receivedAt,
      // };
    },
    RESET_FILES: defaultState,
  },
  defaultState()
);

export const getFiles = (state) => state.files;

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

export const fileReducers = {
  files,
};
