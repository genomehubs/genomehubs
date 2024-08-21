import { createAction, handleActions } from "redux-actions";

import createCachedSelector from "re-reselect";
import immutableUpdate from "immutable-update";

export const requestPhylopic = createAction("REQUEST_PHYLOPIC");
export const receivePhylopic = createAction(
  "RECEIVE_PHYLOPIC",
  (json) => json,
  () => ({ receivedAt: Date.now() })
);
export const resetPhylopic = createAction("RESET_PHYLOPIC");

const defaultState = () => ({
  isFetching: false,
  allIds: [],
  byId: {},
});

export function onReceivePhylopic(state, action) {
  const { payload: phylopic, meta } = action;
  const id = phylopic.taxonId;

  const updatedWithPhylopicState = immutableUpdate(state, {
    byId: { [id]: phylopic },
  });

  const updatedWithPhylopicList = immutableUpdate(updatedWithPhylopicState, {
    allIds: [...new Set(updatedWithPhylopicState.allIds.concat(id))],
  });

  return immutableUpdate(updatedWithPhylopicList, {
    isFetching: false,
    lastUpdated: meta.receivedAt,
  });
}

const phylopics = handleActions(
  {
    REQUEST_PHYLOPIC: (state, action) =>
      immutableUpdate(state, {
        isFetching: true,
      }),
    RECEIVE_PHYLOPIC: onReceivePhylopic,
    RESET_PHYLOPIC: defaultState,
  },
  {
    isFetching: false,
    allIds: [],
    byId: {},
  }
);

export const getPhylopics = (state) => state.phylopics.byId || {};

export const getPhylopicIsFetching = (state) => state.phylopics.isFetching;

export const getPhylopicByTaxonId = createCachedSelector(
  getPhylopics,
  (_state, taxonId) => taxonId,
  (phylopics, taxonId) => {
    return phylopics[taxonId];
  }
)((_state, taxonId) => taxonId);

export const phylopicReducers = {
  phylopics,
};
