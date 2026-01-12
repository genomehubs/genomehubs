import { createAction, handleAction, handleActions } from "redux-actions";

import { produce } from "immer";

export const requestSummary = createAction("REQUEST_SUMMARY");
export const receiveSummary = createAction(
  "RECEIVE_SUMMARY",
  (json) => json,
  () => ({ receivedAt: Date.now() })
);
export const resetSummary = createAction("RESET_SUMMARY");

const defaultSummaryState = () => ({
  isFetching: false,
  requestedById: {},
  allIds: [],
  byId: {},
});

function onReceiveSummary(state, action) {
  const { payload, meta } = action;
  const { status, summaries } = payload;
  const summary = summaries[0];
  const id = `${summary.lineage}--${summary.field}--${summary.name}--${summary.taxonomy}`;

  return produce(state, (draft) => {
    draft.byId[id] = summary;
    draft.allIds = [...new Set(state.allIds.concat(id))];
    draft.isFetching = false;
    draft.status = status;
    draft.lastUpdated = meta.receivedAt;
  });
}

const summaries = handleActions(
  {
    REQUEST_SUMMARY: (state, action) =>
      produce(state, (draft) => {
        draft.isFetching = true;
        draft.requestedById[action.payload] = true;
      }),
    RECEIVE_SUMMARY: onReceiveSummary,
    RESET_SUMMARY: defaultSummaryState,
  },
  defaultSummaryState()
);

export const getSummaries = (state) => state.summaries.byId;
export const getSummariesFetching = (state) => state.summaries.requestedById;

// export const requestLineage = createAction("REQUEST_LINEAGE");
// export const receiveLineage = createAction(
//   "RECEIVE_LINEAGE",
//   (json) => json,
//   () => ({ receivedAt: Date.now() })
// );
// export const resetLineage = createAction("RESET_LINEAGE");

// const defaultLineageState = () => ({
//   isFetching: false,
//   status: {},
//   taxon: {},
//   lineage: [],
// });

// const lineage = handleActions(
//   {
//     REQUEST_LINEAGE: (state, action) =>
//       immutableUpdate(state, {
//         isFetching: true,
//       }),
//     RECEIVE_LINEAGE: (state, action) => {
//       const record = action.payload.records[0].record;
//       return {
//         isFetching: false,
//         status: action.payload.status,
//         taxon: {
//           taxon_id: record.taxon_id,
//           scientific_name: record.scientific_name,
//           taxon_rank: record.taxon_rank,
//         },
//         lineage: record.lineage,
//         lastUpdated: action.meta.receivedAt,
//       };
//     },
//     RESET_LINEAGE: defaultLineageState,
//   },
//   defaultLineageState()
// );

// export const getLineage = (state) => state.lineage;

export const setSummaryField = createAction("SET_SUMMARY_FIELD");
export const summaryField = handleAction(
  "SET_SUMMARY_FIELD",
  (state, action) => action.payload,
  ""
);
export const getSummaryField = (state) => state.summaryField;

export const exploreReducers = {
  summaries,
  // lineage,
  summaryField,
};
