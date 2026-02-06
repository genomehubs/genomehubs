import { apiUrl, setApiStatus } from "#reducers/api";
import {
  getDescendants,
  getDescendantsIsFetchingByTaxonId,
  receiveDescendants,
  requestDescendants,
} from "#reducers/descendants";

import { getCurrentTaxonomy } from "#reducers/taxonomy";
import store from "#store";

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
    const descendantsIsFetching = getDescendantsIsFetchingByTaxonId(
      state,
      taxonId,
    );
    if (descendantsIsFetching || (offset == 0 && descendants[taxonId])) {
      return;
    }
    if (!taxonomy) {
      taxonomy = getCurrentTaxonomy(state);
    }
    dispatch(requestDescendants(taxonId));
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
        }),
      );
    }
  };
}
