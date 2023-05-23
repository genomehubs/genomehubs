import {
  cancelPages,
  getPages,
  receivePages,
  requestPages,
} from "../reducers/pages";

import { createCachedSelector } from "re-reselect";

export const pagesUrl = PAGES_URL || false;
export const webpackHash = COMMIT_HASH || __webpack_hash__;

export function fetchPages(pageId) {
  return async function (dispatch) {
    dispatch(requestPages());
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
