import { createSlice } from "@reduxjs/toolkit";

const defaultState = () => ({
  isFetching: false,
  requestedById: {},
  byId: {},
  namesById: {},
});

const typesSlice = createSlice({
  name: "types",
  initialState: defaultState(),
  reducers: {
    requestTypes(state) {
      state.isFetching = true;
    },
    receiveTypes(state, action) {
      const { status, fields, identifiers, index, hub, release, source } =
        action.payload;
      let byId = {};
      let namesById = {};
      if (index == "multi") {
        byId = fields;
        namesById = identifiers;
      } else {
        byId = { [index]: fields };
        namesById = { [index]: identifiers };
      }
      Object.values(fields).forEach((field) => {
        if (!byId[field.group]) {
          byId[field.group] = {};
        }
        byId[field.group][field.name] = field;
      });
      Object.values(identifiers).forEach((identifier) => {
        if (!namesById[identifier.group]) {
          namesById[identifier.group] = {};
        }
        namesById[identifier.group][identifier.name] = identifier;
      });

      return {
        byId,
        namesById,
        isFetching: false,
        status,
        hub,
        release,
        source,
        lastUpdated: Date.now(),
      };
    },
    resetTypes() {
      defaultState();
    },
  },
});

export const getTypes = (state) => state.types.byId;

export const getNames = (state) => state.types.namesById;

export const getHub = (state) => state.types.hub;

export const getRelease = (state) => state.types.release;

export const getSource = (state) => state.types.source;

export const getTypesFetching = (state) => state.types.isFetching;

export const { receiveTypes, requestTypes, resetTypes } = typesSlice.actions;

export const typeReducers = {
  types: typesSlice.reducer,
};
