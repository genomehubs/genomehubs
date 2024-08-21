import { createAction, handleActions } from "redux-actions";

import createCachedSelector from "re-reselect";
import immutableUpdate from "immutable-update";

export const requestDescendants = createAction("REQUEST_DESCENDANTS");
export const receiveDescendants = createAction(
  "RECEIVE_DESCENDANTS",
  (json) => json,
  () => ({ receivedAt: Date.now() })
);
export const resetDescendants = createAction("RESET_DESCENDANTS");

const defaultState = () => ({
  isFetching: {},
  allIds: [],
  byId: {},
});

function onReceiveDescendants(state, action) {
  const { payload, meta } = action;
  const { taxonId: id, results, count, offset, depth } = payload;

  let updatedWithDescendantsState;
  if (state.byId && state.byId[id]) {
    // let resultIds = new Set(state.byId[id].results.map((r) => r.id));
    // let newResults = results.filter((r) => !resultIds.has(r.id));
    let newResults = results;
    if (newResults.length == 0) {
      return immutableUpdate(state, {
        isFetching: { [id]: false },
      });
    }
    updatedWithDescendantsState = immutableUpdate(state, {
      byId: { [id]: { results: [...state.byId[id].results, ...newResults] } },
      isFetching: { [id]: false },
    });
  } else {
    updatedWithDescendantsState = immutableUpdate(state, {
      byId: { [id]: { results, count, depth } },
      isFetching: { [id]: false },
    });
  }

  const updatedWithDescendantsList = immutableUpdate(
    updatedWithDescendantsState,
    {
      allIds: [...new Set(updatedWithDescendantsState.allIds.concat(id))],
    }
  );

  return immutableUpdate(updatedWithDescendantsList, {
    status,
    lastUpdated: meta.receivedAt,
  });
}

const descendants = handleActions(
  {
    REQUEST_DESCENDANTS: (state, action) =>
      immutableUpdate(state, {
        isFetching: { [action.payload]: true },
      }),
    RECEIVE_DESCENDANTS: onReceiveDescendants,
    RESET_DESCENDANTS: defaultState,
  },
  defaultState()
);

export const getDescendants = (state) => state.descendants.byId;

export const getDescendantsIsFetching = (state) => state.descendants.isFetching;

export const getDescendantsByTaxonId = createCachedSelector(
  getDescendants,
  (_state, taxonId) => taxonId,
  (descendants, taxonId) => {
    return descendants[taxonId];
  }
)((_state, taxonId) => taxonId);

export const getDescendantsIsFetchingByTaxonId = createCachedSelector(
  getDescendantsIsFetching,
  (_state, taxonId) => taxonId,
  (descendantsIsFetching, taxonId) => {
    return descendantsIsFetching[taxonId];
  }
)((_state, taxonId) => taxonId);

export const descendantsReducers = {
  descendants,
};
