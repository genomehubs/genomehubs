import { createAction, handleAction, handleActions } from "redux-actions";

import immutableUpdate from "immutable-update";

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
      immutableUpdate(state, {
        isFetching: true,
      }),
    RECEIVE_TAXONOMIES: (state, action) =>
      immutableUpdate(state, {
        isFetching: false,
        ids: action.payload,
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

export const taxonomyReducers = {
  taxonomies,
  currentTaxonomy,
};
