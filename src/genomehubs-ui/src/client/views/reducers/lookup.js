import { createAction, handleAction, handleActions } from "redux-actions";
import {
  getAttributeTrie,
  getOperatorTrie,
  getRankTrie,
  getSummaryTrie,
  getTaxTrie,
  getValueTrie,
} from "../selectors/types";

import { apiUrl } from "./api";
import immutableUpdate from "immutable-update";
import qs from "qs";
import { setApiStatus } from "./api";
import store from "../store";

const requestLookup = createAction("REQUEST_LOOKUP");
const receiveLookup = createAction(
  "RECEIVE_LOOKUP",
  (json) => json,
  () => ({ receivedAt: Date.now() })
);
export const resetLookup = createAction("RESET_LOOKUP");

const defaultState = () => ({
  isFetching: false,
  status: {},
  results: [],
  suggestions: [],
});

const lookupTerms = handleActions(
  {
    REQUEST_LOOKUP: (state, action) =>
      immutableUpdate(state, {
        isFetching: true,
      }),
    RECEIVE_LOOKUP: (state, action) => ({
      isFetching: false,
      status: action.payload.status,
      results: action.payload.results,
      suggestions: action.payload.suggestions,
      lastUpdated: action.meta.receivedAt,
    }),
    RESET_LOOKUP: defaultState,
  },
  defaultState()
);

export const getLookupTerms = (state) => state.lookupTerms;

export function fetchLookup({
  lookupTerm,
  result = "multi",
  taxonomy,
  lastType,
}) {
  return function (dispatch) {
    let terms = [];
    let state = store.getState();
    let group = lastType.group || lastType.type;
    let trie;
    if (lastType.name) {
      if (lastType.operator) {
        trie = getValueTrie(state, lastType.name);
      } else {
        trie = getOperatorTrie(state);
      }
      if (!trie) {
        return dispatch(resetLookup());
      }
      terms = trie.search(lookupTerm || "*");
      return dispatch(
        receiveLookup({
          status: { success: true },
          results: [
            ...terms.map((obj) => ({
              id: obj.key || obj.name,
              result: { ...obj, group, type: "operator" },
            })),
          ],
        })
      );
    } else if (lastType.type && lastType.type == "rank") {
      trie = getRankTrie(state);

      if (!trie) {
        return dispatch(resetLookup());
      }
      terms = trie.search(lookupTerm || "*");
      return dispatch(
        receiveLookup({
          status: { success: true },
          results: [
            ...terms.map((obj) => ({
              id: obj.key || obj.name,
              result: { ...obj, group, type: "rank" },
            })),
          ],
        })
      );
    }

    if (!lastType.type && lastType.type != "taxon" && !lastType.name) {
      trie = getTaxTrie(state);
      terms = trie.search(lookupTerm);
      trie = getSummaryTrie(state);
      terms = terms.concat(trie.search(lookupTerm));
      trie = getAttributeTrie(state);
      terms = terms.concat(trie.search(lookupTerm));
    }
    if (lookupTerm.length <= 3) {
      if (terms.length == 0) {
        return dispatch(resetLookup());
      }
      return dispatch(
        receiveLookup({
          status: { success: true },
          results: [
            ...terms.map((obj) => ({
              id: obj.value?.key || obj.value?.name || obj.key,
              result: obj.value ? { ...obj.value, group } : { ...obj, group },
            })),
          ],
        })
      );
    }
    dispatch(requestLookup());
    let options = {
      searchTerm: lookupTerm,
      result,
      taxonomy,
    };
    const queryString = qs.stringify(options);
    let url = `${apiUrl}/lookup?${queryString}`;
    return fetch(url)
      .then(
        (response) => response.json(),
        (error) => console.log("An error occured.", error)
      )
      .then((json) => {
        let processed = {
          status: { ...json.status, hits: json.status.hits + terms.length },
          results: [
            ...terms.map((obj) => ({
              id: obj.value.key || obj.value.name || obj.key,
              result: obj.value || obj,
            })),
            ...(json.results && json.results),
          ],
          ...(json.suggestions && { suggestions: json.suggestions }),
        };
        dispatch(receiveLookup(processed));
      })
      .catch((err) => {
        let processed = {
          status: { success: true, hits: terms.length },
          results: [
            ...terms.map((obj) => ({
              id: obj.value?.key || obj.value?.name || obj.key,
              result: obj.value || obj,
            })),
          ],
        };
        dispatch(receiveLookup(processed));
      });
    // .catch((err) => dispatch(setApiStatus(false)));
  };
}

export const setLookupTerm = createAction("SET_LOOKUP_TERM");
export const lookupTerm = handleAction(
  "SET_LOOKUP_TERM",
  (state, action) => action.payload,
  ""
);
export const getLookupTerm = (state) => state.lookupTerm;

export const lookupReducers = {
  lookupTerm,
  lookupTerms,
};
