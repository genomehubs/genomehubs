import {
  getAttributeTrie,
  getKeywordTrie,
  getOperatorTrie,
  getRankTrie,
  getSummaryTrie,
  getTaxTrie,
  getValueTrie,
} from "#selectors/types";

import { apiUrl } from "#reducers/api";
import qs from "./qs";
import store from "#store";

const defaultState = () => ({
  isFetching: false,
  status: {},
  results: [],
  suggestions: [],
});

export const fetchAutocomplete = ({
  lookupTerm,
  result = "multi",
  taxonomy,
  lastType,
}) => {
  if (!lookupTerm) {
    if (lastType.name) {
      lookupTerm = "*";
    } else {
      return defaultState;
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
      return defaultState;
    }
    terms = trie.search(lookupTerm);
    return {
      ...defaultState,
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
    };
  } else if (
    lastType.type &&
    (lastType.type == "rank" || lastType.type == "cat")
  ) {
    trie = getRankTrie(state);

    if (!trie) {
      return defaultState;
    }
    terms = trie.search(lookupTerm || (lastType.type == "rank" && "*"));
    if (lastType.type == "cat") {
      trie = getKeywordTrie(state);
      terms = terms.concat(trie.search(lookupTerm));
    }
    return {
      ...defaultState,
      status: { success: true },
      results: [
        ...terms.map((obj) => ({
          id: obj.value?.key || obj.value?.name || obj.key || obj.name,
          result: obj.value
            ? { ...obj.value, group }
            : { ...obj, group: "rank", type: "rank" },
        })),
      ],
    };
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
      return defaultState;
    }
    return {
      ...defaultState,
      status: { success: true },
      results: [
        ...terms.map((obj) => ({
          id: obj.value?.key || obj.value?.name || obj.key,
          result: obj.value ? { ...obj.value, group } : { ...obj, group },
        })),
      ],
    };
  }
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
      return {
        ...defaultState,
        status: { ...json.status, hits: json.status.hits + terms.length },
        results: [
          ...terms.map((obj) => ({
            id: obj.value.key || obj.value.name || obj.key,
            result: obj.value || obj,
          })),
          ...(json.results || []),
        ],
        ...(json.suggestions && { suggestions: json.suggestions }),
      };
    })
    .catch((err) => {
      return {
        ...defaultState,
        status: { success: true, hits: terms.length },
        results: [
          ...terms.map((obj) => ({
            id: obj.value?.key || obj.value?.name || obj.key,
            result: obj.value || obj,
          })),
        ],
      };
    });
  // .catch((err) => dispatch(setApiStatus(false)));
};
