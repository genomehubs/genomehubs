import { createAction, handleActions } from "redux-actions";

import { byIdSelectorCreator } from "#reducers/selectorCreators";
import createCachedSelector from "re-reselect";
import { createSlice } from "@reduxjs/toolkit";
import { current } from "@reduxjs/toolkit";
import { produce } from "immer";

const defaultState = () => ({
  isFetching: false,
  isFetchingById: { _null: true },
  allIds: [],
  byId: {},
});

export function onReceivePhylopic(state, action) {
  const { payload: phylopic } = action;
  const id = phylopic.taxonId;
  return {
    ...state,
    isFetching: false,
    allIds: [...new Set(state.allIds.concat(id))],
    byId: {
      ...state.byId,
      [id]: phylopic,
    },
    lastUpdated: Date.now(),
  };
}

const phylopicsSlice = createSlice({
  name: "phylopics",
  initialState: defaultState(),
  reducers: {
    requestPhylopic(state, action) {
      state.isFetching = true;
      state.isFetchingById[action.payload] = true;
    },
    receivePhylopic(state, action) {
      return onReceivePhylopic(state, action);
    },
    resetPhylopic(state) {
      defaultState();
    },
  },
});

export const getPhylopics = (state) => state.phylopics.byId || {};

export const getPhylopicIsFetching = (state) => state.phylopics.isFetching;

export const getPhylopicIsFetchingById = (state) =>
  state.phylopics.isFetchingById;

export const { requestPhylopic, receivePhylopic, resetPhylopic } =
  phylopicsSlice.actions;

const createSelectorForTaxonId = byIdSelectorCreator();
const _getTaxonIdAsMemoKey = (_state, taxonId) => {
  return taxonId;
};

export const getPhylopicByTaxonId = createCachedSelector(
  getPhylopics,
  (_state, taxonId) => taxonId,
  (phylopics, taxonId) => {
    return phylopics[taxonId];
  },
)((_state, taxonId) => taxonId);

export const phylopicReducers = {
  phylopics: phylopicsSlice.reducer,
};
