import { createAction, handleAction, handleActions } from "redux-actions";
import { getAnalytics, trackPage } from "./tracking";

import { byIdSelectorCreator } from "./selectorCreators";
import { createSelector } from "reselect";
import history from "./history";
import qs from "../functions/qs";
import { queryToStore } from "../querySync";
import store from "../store";

export const basename = BASENAME || "";

export const siteName = SITENAME || "";

export const setPathname = createAction("SET_PATHNAME");
export const pathname = handleAction(
  "SET_PATHNAME",
  (state, action) => action.payload,
  document.location.pathname
    .replace(new RegExp("^" + basename), "")
    .replace("notfound", "") || ""
);
export const getPathname = (state) => {
  return state.pathname;
};

const options = [
  "about",
  "explore",
  "landing",
  "notfound",
  "records",
  "report",
  "search",
  "tutorials",
];

export const getViews = createSelector(getPathname, (pathname) => {
  let path = pathname.replace(/^\//, "").replace(/\/$/, "").split("/");
  let views = {};
  let nextView = undefined;
  let primary = undefined;
  for (let i = 0; i < path.length; i++) {
    if (options.includes(path[i])) {
      if (!primary) {
        primary = path[i];
      }
      nextView = path[i];
    }
  }
  views.primary = primary || "landing";
  return views;
});

export const getView = createSelector(getViews, (views) => views.primary);

export const getStatic = createSelector(getViews, (views) => views.static);

export const getDatasetID = createSelector(getViews, (views) => views.dataset);

export const getSearchTerm = createSelector(getViews, (views) =>
  decodeURI(views.search)
);

export const viewsToPathname = (views) => {
  let pathname = "";
  options.forEach((view) => {
    if (views[view]) {
      if (view == "landing") {
        pathname = "/";
      } else if (views[view]) {
        pathname = view;
      }
    }
  });
  return pathname;
};

export const updatePathname = (update = {}, remove = {}) => {
  return function (dispatch) {
    let state = store.getState();
    let currentPathname = getPathname(state);
    let hash = getHashString(state);
    let search = getQueryString(state);
    let id = getDatasetID(state);
    let views = getViews(state);
    let static_url = state.staticURL;
    let newViews = {};
    let primary = views.primary;
    Object.keys(update).forEach((key) => {
      newViews[key] = update[key];
    });
    Object.keys(remove).forEach((key) => {
      delete newViews[key];
      if (key == primary) primary = false;
    });
    let pathname = viewsToPathname(newViews);
    if (pathname != currentPathname) {
      history.push({ pathname, hash, search });
      if (getAnalytics(state)) {
        trackPage(
          pathname +
            (search ? `?${search.replace(/^\?/, "")}` : "") +
            (hash ? `#${hash}` : "")
        );
      }
      dispatch(setPathname(pathname));
    }
  };
};

export const chooseView = (view) => {
  return function (dispatch) {
    dispatch(updatePathname({ [view]: true }));
  };
};

export const setQueryString = createAction("SET_QUERY_STRING");
export const queryString = handleAction(
  "SET_QUERY_STRING",
  (state, action) => action.payload,
  (document.location.search || "").replace("?", "")
);
export const getQueryString = (state) => state.queryString || "";

export const getParsedQueryString = createSelector(getQueryString, (str) =>
  qs.parse(str)
);

export const setHashString = createAction("SET_HASH_VALUE");
export const hashString = handleAction(
  "SET_HASH_VALUE",
  (state, action) => action.payload,
  (document.location.hash || "").replace("#", "")
);
export const getHashString = (state) => state.hashString || "";

export const toggleHash = (value) => {
  return function (dispatch) {
    let state = store.getState();
    let currentHash = getHashString(state);
    let currentQuery = getQueryString(state);
    if (currentHash && currentHash == value) {
      history.push({ hash: "", search: currentQuery });
      dispatch(setHashString(""));
    } else {
      history.push({ hash: "#" + value, search: currentQuery });
      dispatch(setHashString(value));
    }
  };
};

export const removeHash = (value) => {
  return function (dispatch) {
    let state = store.getState();
    let currentHash = getHashString(state);
    if (value) {
      if (currentHash == value) {
        dispatch(toggleHash(value));
      }
    } else {
      dispatch(toggleHash(currentHash));
    }
  };
};

window.onpopstate = (e) => {
  let state = store.getState();
  let currentQuery = getQueryString(state);
  let str = document.location.search.replace(/^\?/, "");
  let values = qs.parse(str);
  store.dispatch(
    queryToStore({ values, searchReplace: true, currentQuery, action: "POP" })
  );
};

export const parseQueryString = createSelector(getQueryString, (str = "") =>
  qs.parse(str.replace("?", ""))
);

const createSelectorForQueryValue = byIdSelectorCreator();

const _getQueryIdAsMemoKey = (queryId) => queryId;

const getQueryId = (queryId) => queryId;

export const getQueryValue = createSelector(
  getQueryId,
  parseQueryString,
  (id, parsed) => {
    return parsed[id] || "";
  }
);

export const locationReducers = {
  pathname,
  hashString,
  queryString,
};
