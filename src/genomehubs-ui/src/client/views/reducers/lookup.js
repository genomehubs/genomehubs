import { createAction, handleAction, handleActions } from "redux-actions";

import { apiUrl } from "./api";
import { getAttributeTrie } from "../selectors/types";
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
    if (lastType.name && !lastType.operator) {
      let group = lastType.group;
      terms = [
        {
          key: "and",
          value: {
            display_name: "boolean AND",
            group,
            key: "AND",
            type: "operator",
          },
        },
        {
          key: "lt",
          value: {
            display_name: "less than",
            group,
            key: "<",
            type: "operator",
          },
        },
        {
          key: "lte",
          value: {
            display_name: "less than or equal to",
            group,
            key: "<=",
            type: "operator",
          },
        },
        {
          key: "eq",
          value: {
            display_name: "equal to",
            group,
            key: "=",
            type: "operator",
          },
        },
        {
          key: "ne",
          value: {
            display_name: "not equal to",
            group,
            key: "!=",
            type: "operator",
          },
        },
        {
          key: "gte",
          value: {
            display_name: "greater than or equal to",
            group,
            key: ">=",
            type: "operator",
          },
        },
        {
          key: "gt",
          value: {
            display_name: "greater than",
            group,
            key: ">",
            type: "operator",
          },
        },
      ];
      return dispatch(
        receiveLookup({
          status: { success: true },
          results: [
            ...terms.map((obj) => ({
              id: obj.value.key || obj.value.name,
              result: obj.value,
            })),
          ],
        })
      );
    }

    if (lastType.name && lastType.summary.includes("enum")) {
      let group = lastType.group;
      terms = lastType.constraint.enum.map((key) => ({
        key,
        value: {
          display_name: key,
          group,
          key,
          type: "value",
        },
      }));
      return dispatch(
        receiveLookup({
          status: { success: true },
          results: [
            ...terms.map((obj) => ({
              id: obj.value.key || obj.value.name,
              result: obj.value,
            })),
          ],
        })
      );
    }
    //if (!lookupTerm) dispatch(receiveLookup(defaultState));
    // if (lookupTerm.match(/[\(\)<>=]/)) return;

    console.log(lastType);

    let state = store.getState();
    let trie = getAttributeTrie(state);
    if (lastType.type != "taxon" && !lastType.name) {
      terms = trie.search(lookupTerm);
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
        dispatch(
          receiveLookup({
            status: json.status,
            results: [
              ...terms.map((obj) => ({
                id: obj.value.key || obj.value.name,
                result: obj.value,
              })),
              ...(json.results && json.results),
            ],
          })
        );
      })
      .catch((err) => dispatch(setApiStatus(false)));
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
