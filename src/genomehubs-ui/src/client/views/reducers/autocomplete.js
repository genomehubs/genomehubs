import { createAction, handleActions } from "redux-actions";

import { produce } from "immer";

export const requestAutocomplete = createAction("REQUEST_AUTOCOMPLETE");
export const receiveAutocomplete = createAction(
  "RECEIVE_AUTOCOMPLETE",
  (json) => json,
  () => ({ receivedAt: Date.now() }),
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
      produce(state, (draft) => {
        draft.isFetching = true;
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
  defaultState(),
);

export const getAutocompleteTerms = (state) => state.autocompleteTerms;

export const autocompleteReducers = {
  autocompleteTerms,
};
