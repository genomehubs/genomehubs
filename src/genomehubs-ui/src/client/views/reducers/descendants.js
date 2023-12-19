import { createAction, handleAction, handleActions } from "redux-actions";

import { apiUrl } from "./api";
import createCachedSelector from "re-reselect";
import { createSelector } from "reselect";
import { getCurrentTaxonomy } from "./taxonomy";
import immutableUpdate from "immutable-update";
import { setApiStatus } from "./api";
import store from "../store";

const requestDescendants = createAction("REQUEST_DESCENDANTS");
const receiveDescendants = createAction(
  "RECEIVE_DESCENDANTS",
  (json) => json,
  () => ({ receivedAt: Date.now() })
);
export const resetDescendants = createAction("RESET_DESCENDANTS");

const defaultState = () => ({
  isFetching: false,
  allIds: [],
  byId: {},
});

function onReceiveDescendants(state, action) {
  const { payload, meta } = action;
  const { taxonId: id, results, count, offset, depth } = payload;

  let updatedWithDescendantsState;
  if (state.byId && state.byId[id]) {
    updatedWithDescendantsState = immutableUpdate(state, {
      byId: { [id]: { results: [...state.byId[id].results, ...results] } },
    });
  } else {
    updatedWithDescendantsState = immutableUpdate(state, {
      byId: { [id]: { results, count, depth } },
    });
  }

  const updatedWithDescendantsList = immutableUpdate(
    updatedWithDescendantsState,
    {
      allIds: [...new Set(updatedWithDescendantsState.allIds.concat(id))],
    }
  );

  return immutableUpdate(updatedWithDescendantsList, {
    isFetching: false,
    status,
    lastUpdated: meta.receivedAt,
  });
}

const descendants = handleActions(
  {
    REQUEST_DESCENDANTS: (state, action) =>
      immutableUpdate(state, {
        isFetching: true,
      }),
    RECEIVE_DESCENDANTS: onReceiveDescendants,
    RESET_DESCENDANTS: defaultState,
  },
  defaultState()
);

export const getDescendants = (state) => state.descendants.byId;

export const getDescendantsIsFetching = (state) => state.descendants.isFetching;

export const getDescendantsByTaxonId = createCachedSelector(
  getDescendants,
  (_state, taxonId) => taxonId,
  (descendants, taxonId) => {
    return descendants[taxonId];
  }
)((_state, taxonId) => taxonId);

export function fetchDescendants({
  taxonId,
  taxonomy,
  depth = 1,
  rank,
  offset = 0,
  size = 10,
}) {
  return async function (dispatch) {
    const state = store.getState();
    const descendants = getDescendants(state);
    if (offset == 0 && descendants[taxonId]) {
      return;
    }
    if (!taxonomy) {
      taxonomy = getCurrentTaxonomy(state);
    }
    dispatch(requestDescendants());
    const endpoint = "search";
    let lastJson = {};
    let maxDepth = 30;
    for (depth; depth < maxDepth; depth++) {
      let url = `${apiUrl}/${endpoint}?query=tax_tree%28${taxonId}%29%20AND%20tax_depth%28${depth}%29&fields=none&sortBy=scientific_name&sortOrder=asc&size=${size}&offset=${offset}`;
      if (rank) {
        url = `${apiUrl}/${endpoint}?query=tax_tree%28${taxonId}%29%20AND%20tax_rank%28${rank}%29&fields=none&sortBy=scientific_name&sortOrder=asc&size=${size}&offset=${offset}`;
        depth = maxDepth;
      }
      try {
        let json;
        try {
          const response = await fetch(url);
          json = await response.json();
        } catch (error) {
          console.log("An error occured.", error);
        }
        if (
          json &&
          json.status &&
          json.status.success &&
          json.status.hits >= 1
        ) {
          lastJson = json;
          if (json.status.hits == 1) {
            if (lastJson.results[0].result.taxon_rank == "species") {
              break;
            }
            continue;
          }
          break;
        }
      } catch (err) {
        return dispatch(setApiStatus(false));
      }
    }
    if (lastJson.results) {
      dispatch(
        receiveDescendants({
          taxonId,
          results: lastJson.results,
          count: lastJson.status.hits,
          offset,
          depth: depth < maxDepth ? depth : 1,
        })
      );
    }
  };
}

export const descendantsReducers = {
  descendants,
};
