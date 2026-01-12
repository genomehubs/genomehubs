import { createAction, handleActions } from "redux-actions";

import { produce } from "immer";

export const requestFiles = createAction("REQUEST_FILES");
export const receiveFiles = createAction(
  "RECEIVE_FILES",
  (json) => json,
  () => ({ receivedAt: Date.now() }),
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
      produce(state, (draft) => {
        draft.isFetching = true;
      }),
    CANCEL_FILES: (state, action) =>
      produce(state, (draft) => {
        draft.isFetching = false;
      }),
    RECEIVE_FILES: (state, action) => {
      let byAnalysisId = {};
      action.payload.results.forEach((result) => {
        let { analysis_id } = result.result;
        if (!byAnalysisId[analysis_id]) {
          byAnalysisId[analysis_id] = {
            byId: {},
            allIds: [],
            status: action.payload.status,
          };
        }
        let { file_id } = result.result;
        if (!byAnalysisId[analysis_id].byId[file_id]) {
          byAnalysisId[analysis_id].allIds.push(file_id);
        }
        byAnalysisId[analysis_id].byId[file_id] = result.result;
      });
      return produce(state, (draft) => {
        draft.isFetching = false;
        draft.byAnalysisId = { ...state.byAnalysisId, ...byAnalysisId };
      });
    },
    RESET_FILES: defaultState,
  },
  defaultState(),
);

export const getFiles = (state) => state.files;

export const fileReducers = {
  files,
};
