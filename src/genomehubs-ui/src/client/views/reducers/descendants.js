import { createAction, handleActions } from "redux-actions";

import { createCachedSelector } from "re-reselect";
import { produce } from "immer";

export const requestDescendants = createAction("REQUEST_DESCENDANTS");
export const receiveDescendants = createAction(
  "RECEIVE_DESCENDANTS",
  (json) => json,
  () => ({ receivedAt: Date.now() }),
);
export const resetDescendants = createAction("RESET_DESCENDANTS");

const defaultState = () => ({
  isFetching: {},
  allIds: [],
  byId: {},
});

function onReceiveDescendants(state, action) {
  const { payload, meta } = action;
  const { taxonId: id, results, count, offset, depth, status } = payload;

  return produce(state, (draft) => {
    if (state.byId && state.byId[id]) {
      let newResults = results;
      if (newResults.length > 0) {
        draft.byId[id].results = [...state.byId[id].results, ...newResults];
      }
      draft.isFetching[id] = false;
    } else {
      draft.byId[id] = { results, count, depth };
      draft.isFetching[id] = false;
    }
    draft.allIds = [...new Set(state.allIds.concat(id))];
    draft.status = status;
    draft.lastUpdated = meta.receivedAt;
  });
}

const descendants = handleActions(
  {
    REQUEST_DESCENDANTS: (state, action) =>
      produce(state, (draft) => {
        draft.isFetching[action.payload] = true;
      }),
    RECEIVE_DESCENDANTS: onReceiveDescendants,
    RESET_DESCENDANTS: defaultState,
  },
  defaultState(),
);

export const getDescendants = (state) => state.descendants.byId;

export const getDescendantsIsFetching = (state) => state.descendants.isFetching;

export const getDescendantsByTaxonId = createCachedSelector(
  getDescendants,
  (_state, taxonId) => taxonId,
  (descendants, taxonId) => {
    return descendants[taxonId];
  },
)((_state, taxonId) => taxonId);

export const getDescendantsIsFetchingByTaxonId = createCachedSelector(
  getDescendantsIsFetching,
  (_state, taxonId) => taxonId,
  (descendantsIsFetching, taxonId) => {
    return descendantsIsFetching[taxonId];
  },
)((_state, taxonId) => taxonId);

export const descendantsReducers = {
  descendants,
};
