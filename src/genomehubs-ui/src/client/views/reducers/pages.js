import { createAction, handleAction, handleActions } from "redux-actions";

import { createCachedSelector } from "re-reselect";
import { createSelector } from "reselect";
import { fetchSearchResults } from "../selectors/search";
import immutableUpdate from "immutable-update";
import qs from "qs";

export const requestPages = createAction("REQUEST_PAGE");
export const receivePages = createAction(
  "RECEIVE_PAGE",
  (json) => json,
  () => ({ receivedAt: Date.now() })
);
export const cancelPages = createAction("CANCEL_PAGE");

const defaultState = () => ({
  isFetching: false,
  byId: {},
});

const pages = handleActions(
  {
    REQUEST_PAGE: (state, action) =>
      immutableUpdate(state, {
        isFetching: true,
      }),
    CANCEL_PAGE: (state, action) =>
      immutableUpdate(state, {
        isFetching: false,
      }),
    RECEIVE_PAGE: (state, action) => {
      let byId = {};
      let { pageId, markdown } = action.payload;
      return immutableUpdate(state, {
        isFetching: false,
        byId: { ...state.byId, [pageId]: markdown },
      });
    },
  },
  defaultState()
);

export const getPages = (state) => state.pages;

export const pageReducers = {
  pages,
};
