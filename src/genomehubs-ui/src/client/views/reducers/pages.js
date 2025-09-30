import { createAction, handleActions } from "redux-actions";

import immutableUpdate from "immutable-update";

export const requestPages = createAction("REQUEST_PAGE");
export const receivePages = createAction(
  "RECEIVE_PAGE",
  (json) => json,
  () => ({ receivedAt: Date.now() }),
);
export const cancelPages = createAction("CANCEL_PAGE");

const defaultState = () => ({
  isFetching: {},
  byId: {},
});

const pages = handleActions(
  {
    REQUEST_PAGE: (state, action) => {
      let { pageId } = action.payload;
      return immutableUpdate(state, {
        ...state,
        isFetching: { ...state.isFetching, [pageId]: true },
      });
    },
    CANCEL_PAGE: (state, action) => {
      let { pageId } = action.payload;
      return immutableUpdate(state, {
        ...state,
        isFetching: { ...state.isFetching, [pageId]: false },
      });
    },
    RECEIVE_PAGE: (state, action) => {
      let byId = {};
      let { pageId, markdown } = action.payload;
      if (state.byId[pageId]) {
        return state;
      }
      return immutableUpdate(state, {
        isFetching: { ...state.isFetching, [pageId]: false },
        byId: { ...state.byId, [pageId]: markdown || " " },
      });
    },
  },
  defaultState(),
);

export const getPages = (state) => state.pages;
export const getPagesIsFetching = (state) => state.pages.isFetching;

export const pageReducers = {
  pages,
};
