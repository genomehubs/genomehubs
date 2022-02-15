import { createAction, handleAction, handleActions } from "redux-actions";

import immutableUpdate from "immutable-update";
import qs from "qs";
import { setApiStatus } from "./api";

const apiUrl = API_URL || "/api/v1";

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

export function fetchLookup({ lookupTerm, result = "multi", taxonomy }) {
  return function (dispatch) {
    if (!lookupTerm) dispatch(receiveLookup(defaultState));
    if (lookupTerm.match(/[\(\)<>=]/)) return;
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
        dispatch(receiveLookup(json));
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
