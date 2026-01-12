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
    console.log(`Fetching page ${pageId}...`);
    const state = store.getState();
    const isFetching = getPagesIsFetchingById(state, pageId);
    if (isFetching) {
      return;
    }
    dispatch(requestPages({ pageId }));

    try {
      let markdown;
      // Normalize pageId: remove .md extension if present, server will add it
      const normalizedPath = pageId.toLowerCase().replace(/\.md$/i, "");
      const apiUrl = `/assets/markdown/${normalizedPath}`;

      // First try: API endpoint (Node.js SSR server - production and testing)
      try {
        const apiResponse = await fetch(apiUrl);
        const contentType = apiResponse.headers.get("content-type") || "";

        // Check if we got markdown (text/plain) not HTML error page
        if (apiResponse.ok && contentType.includes("text/plain")) {
          markdown = await apiResponse.text();
          console.log(`Fetched from API endpoint ${apiUrl}`);
        } else {
          // API didn't return markdown, try webpack-bundled static markdown
          const webpackUrl =
            `${pagesUrl}/${webpackHash}/${pageId.toLowerCase()}`
              .replaceAll("//", "/")
              .replace("/assets/markdown", ""); // remove /assets/markdown if present
          console.log(
            `API returned ${contentType || "unknown"}, trying webpack path ${webpackUrl}`,
          );
          const webpackResponse = await fetch(webpackUrl);
          if (webpackResponse.ok) {
            markdown = await webpackResponse.text();
          } else {
            markdown = false;
          }
        }
      } catch (error) {
        console.log(
          "Error fetching from API, trying webpack fallback...",
          error,
        );
        // Webpack dev server fallback
        try {
          const webpackUrl =
            `${pagesUrl}/${webpackHash}/${pageId.toLowerCase()}`.replaceAll(
              "//",
              "/",
            );
          const webpackResponse = await fetch(webpackUrl);
          if (webpackResponse.ok) {
            markdown = await webpackResponse.text();
          } else {
            markdown = false;
          }
        } catch (webpackError) {
          markdown = false;
        }
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
  (pages, pageId) => processPages(pages, pageId),
)((_state, pageId) => pageId);

export const getPagesIsFetchingById = createCachedSelector(
  getPagesIsFetching,
  (_state, pageId) => pageId,
  (pagesIsFetching, pageId) => pagesIsFetching[pageId] || false,
)((_state, pageId) => pageId);
