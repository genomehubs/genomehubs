import { createAction, handleAction, handleActions } from "redux-actions";
import {
  getAttributeTrie,
  getKeywordTrie,
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

const requestAutocomplete = createAction("REQUEST_AUTOCOMPLETE");
const receiveAutocomplete = createAction(
  "RECEIVE_AUTOCOMPLETE",
  (json) => json,
  () => ({ receivedAt: Date.now() })
);
export const resetAutocomplete = createAction("RESET_AUTOCOMPLETE");

const defaultState = () => ({
  isFetching: false,
  status: {},
  results: [],
  suggestions: [],
});

const autocompleteTerms = handleActions(
  {
    REQUEST_AUTOCOMPLETE: (state, action) =>
      immutableUpdate(state, {
        isFetching: true,
      }),
    RECEIVE_AUTOCOMPLETE: (state, action) => ({
      isFetching: false,
      status: action.payload.status,
      results: action.payload.results,
      suggestions: action.payload.suggestions,
      lastUpdated: action.meta.receivedAt,
    }),
    RESET_AUTOCOMPLETE: defaultState,
  },
  defaultState()
);

export const getAutocompleteTerms = (state) => state.autocompleteTerms;

export function fetchAutocomplete({
  lookupTerm,
  result = "multi",
  taxonomy,
  lastType,
}) {
  return function (dispatch) {
    if (!lookupTerm) {
      if (lastType.name) {
        lookupTerm = "*";
      } else {
        return dispatch(resetAutocomplete());
      }
    }
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
        return dispatch(resetAutocomplete());
      }
      terms = trie.search(lookupTerm);
      return dispatch(
        receiveAutocomplete({
          status: { success: true },
          results: [
            ...terms.map((obj) => ({
              id: obj.key || obj.name,
              result: {
                ...obj,
                group,
                type: lastType.operator ? "value" : "operator",
              },
            })),
          ],
        })
      );
    } else if (
      lastType.type &&
      (lastType.type == "rank" || lastType.type == "cat")
    ) {
      trie = getRankTrie(state);

      if (!trie) {
        return dispatch(resetAutocomplete());
      }
      terms = trie.search(lookupTerm || (lastType.type == "rank" && "*"));
      if (lastType.type == "cat") {
        trie = getKeywordTrie(state);
        terms = terms.concat(trie.search(lookupTerm));
      }
      return dispatch(
        receiveAutocomplete({
          status: { success: true },
          results: [
            ...terms.map((obj) => ({
              id: obj.value?.key || obj.value?.name || obj.key || obj.name,
              result: obj.value
                ? { ...obj.value, group }
                : { ...obj, group: "rank", type: "rank" },
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
        return dispatch(resetAutocomplete());
      }
      return dispatch(
        receiveAutocomplete({
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
    dispatch(requestAutocomplete());
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
            ...(json.results ? json.results : []),
          ],
          ...(json.suggestions && { suggestions: json.suggestions }),
        };
        dispatch(receiveAutocomplete(processed));
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
        dispatch(receiveAutocomplete(processed));
      });
    // .catch((err) => dispatch(setApiStatus(false)));
  };
}

export const autocompleteReducers = {
  autocompleteTerms,
};
