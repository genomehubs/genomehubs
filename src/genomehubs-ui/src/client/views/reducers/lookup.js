import { createAction, handleAction } from "redux-actions";

import immutableUpdate from "immutable-update";

export const setLookupTerm = createAction("SET_LOOKUP_TERM");
export const lookupTerm = handleAction(
  "SET_LOOKUP_TERM",
  (state, action) => action.payload,
  ""
);
export const getLookupTerm = (state) => state.lookupTerm;

export const setLiveQuery = createAction("SET_LIVE_QUERY");
export const liveQuery = handleAction(
  "SET_LIVE_QUERY",
  (state, action) => action.payload,
  ""
);
export const getLiveQuery = (state) => state.liveQuery;

export const setInputQueries = createAction("SET_INPUT_QUERIES");
export const inputQueries = handleAction(
  "SET_INPUT_QUERIES",
  (state, action) =>
    immutableUpdate(state, {
      byId: { [action.payload.id]: action.payload },
      allIds: [...state.allIds, action.payload.id],
    }),
  { allIds: [], byId: {} }
);
export const getInputQueries = (state) => state.inputQueries.byId;

export const lookupReducers = {
  lookupTerm,
  liveQuery,
  inputQueries,
};
