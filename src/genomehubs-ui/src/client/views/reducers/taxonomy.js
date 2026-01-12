import { createAction, handleAction, handleActions } from "redux-actions";

import { produce } from "immer";

export const requestTaxonomies = createAction("REQUEST_TAXONOMIES");
export const receiveTaxonomies = createAction(
  "RECEIVE_TAXONOMIES",
  (json) => json,
  () => ({ receivedAt: Date.now() })
);

const defaultState = () => ({
  isFetching: false,
  ids: [],
});

const taxonomies = handleActions(
  {
    REQUEST_TAXONOMIES: (state, action) =>
      produce(state, (draft) => {
        draft.isFetching = true;
      }),
    RECEIVE_TAXONOMIES: (state, action) =>
      produce(state, (draft) => {
        draft.isFetching = false;
        draft.ids = action.payload;
      }),
  },
  defaultState()
);

export const getTaxonomies = (state) => state.taxonomies.ids;

export const getTaxonomiesFetching = (state) => state.taxonomies.isFetching;

export const setCurrentTaxonomy = createAction("SET_CURRENT_TAXONOMY");
export const currentTaxonomy = handleAction(
  "SET_CURRENT_TAXONOMY",
  (state, action) => action.payload || TAXONOMY || "",
  ""
);
export const getCurrentTaxonomy = (state) => state.currentTaxonomy;

export const requestIndices = createAction("REQUEST_INDICES");
export const receiveIndices = createAction(
  "RECEIVE_INDICES",
  (json) => json,
  () => ({ receivedAt: Date.now() })
);

const indices = handleActions(
  {
    REQUEST_INDICES: (state, action) =>
      produce(state, (draft) => {
        draft.isFetching = true;
      }),
    RECEIVE_INDICES: (state, action) =>
      produce(state, (draft) => {
        draft.isFetching = false;
        draft.ids = action.payload;
      }),
  },
  defaultState()
);

export const getIndices = (state) => state.indices.ids;

export const getIndicesFetching = (state) => state.indices.isFetching;

export const taxonomyReducers = {
  indices,
  taxonomies,
  currentTaxonomy,
};
