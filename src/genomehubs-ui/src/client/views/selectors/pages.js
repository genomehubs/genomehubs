import {
  cancelPages,
  getPages,
  receivePages,
  requestPages,
} from "../reducers/pages";

import { createCachedSelector } from "re-reselect";
import { createSelector } from "reselect";
import qs from "qs";

export const pagesUrl = PAGES_URL || false;
export const webpackHash = __webpack_hash__ || COMMIT_HASH;

export function fetchPages(pageId) {
  return async function (dispatch) {
    dispatch(requestPages());
    let url = `${pagesUrl}/${pageId}?${webpackHash}`;
    try {
      let markdown;
      try {
        // .then(response => response.text())
        // .then(result => document.getElementById('content').innerHTML = marked(result));
        const response = await fetch(url);
        markdown = await response.text();
      } catch (error) {
        console.log("An error occured.", error);
        markdown = false;
      }
      dispatch(receivePages({ pageId, markdown }));
    } catch (err) {
      dispatch(cancelPages);
    }
  };
}

const processPages = (pages, pageId) => {
  let page = pages.byId[pageId];
  if (page === false) return false;
  if (!page) return undefined;
  if (pageId == "tabs.md") {
    page = page
      .split("\n")
      .filter((line) => line.match(/^-/))
      .join("\n");
  }
  return page;
};

export const getPagesById = createCachedSelector(
  getPages,
  (_state, pageId) => pageId,
  (pages, pageId) => processPages(pages, pageId)
)((_state, pageId) => pageId);
