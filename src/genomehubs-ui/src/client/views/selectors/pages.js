import {
  cancelPages,
  getPages,
  getPagesIsFetching,
  receivePages,
  requestPages,
} from "../reducers/pages";

import { createCachedSelector } from "re-reselect";
import store from "../store";

export const pagesUrl = PAGES_URL || false;
export const webpackHash = COMMIT_HASH || __webpack_hash__;

export function fetchPages(pageId) {
  return async function (dispatch) {
    const state = store.getState();
    const isFetching = getPagesIsFetchingById(state, pageId);
    if (isFetching) {
      return;
    }
    dispatch(requestPages({ pageId }));
    let url = `${pagesUrl}/${webpackHash}/${pageId.toLowerCase()}`.replaceAll(
      "//",
      "/"
    );
    // let url = `${pagesUrl}/${pageId}`;
    try {
      let markdown;
      try {
        const response = await fetch(url);
        markdown = await response.text();
      } catch (error) {
        console.log("An error occured.", error);
        markdown = false;
      }
      dispatch(receivePages({ pageId, markdown }));
    } catch (err) {
      dispatch(cancelPages({ pageId }));
    }
  };
}

const processPages = (pages, pageId) => {
  let page = pages.byId[pageId];
  if (page === false) {
    return false;
  }
  if (!page) {
    return undefined;
  }
  if (pageId == "tabs.md") {
    page = page
      .split("\n")
      .filter((line) => line.match(/^-[^-]/))
      .join("\n");
  }
  return page;
};

export const getPagesById = createCachedSelector(
  getPages,
  (_state, pageId) => pageId,
  (pages, pageId) => processPages(pages, pageId)
)((_state, pageId) => pageId);

export const getPagesIsFetchingById = createCachedSelector(
  getPagesIsFetching,
  (_state, pageId) => pageId,
  (pagesIsFetching, pageId) => pagesIsFetching[pageId] || false
)((_state, pageId) => pageId);
