import { createAction, handleAction, handleActions } from "redux-actions";

import immutableUpdate from "immutable-update";

export const requestTypes = createAction("REQUEST_TYPES");
export const receiveTypes = createAction(
  "RECEIVE_TYPES",
  (json) => json,
  () => ({ receivedAt: Date.now() })
);
export const resetTypes = createAction("RESET_TYPES");

const defaultState = () => ({
  isFetching: false,
  requestedById: {},
  byId: {},
  namesById: {},
});

function onReceiveTypes(state, action) {
  const { payload, meta } = action;
  const { status, fields, identifiers, index, hub, release, source } = payload;
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

  const updatedWithTypesState = immutableUpdate(state, {
    byId,
    namesById,
  });
  const updatedWithMeta = immutableUpdate(updatedWithTypesState, {
    isFetching: false,
    status,
    hub,
    release,
    source,
    lastUpdated: meta.receivedAt,
  });
  return updatedWithMeta;
}

const types = handleActions(
  {
    REQUEST_TYPES: (state, action) =>
      immutableUpdate(state, {
        isFetching: true,
      }),
    RECEIVE_TYPES: onReceiveTypes,
    RESET_TYPES: defaultState,
  },
  defaultState()
);

export const getTypes = (state) => state.types.byId;

export const getNames = (state) => state.types.namesById;

export const getHub = (state) => state.types.hub;

export const getRelease = (state) => state.types.release;

export const getSource = (state) => state.types.source;

export const getTypesFetching = (state) => state.types.isFetching;

export const typeReducers = {
  types,
};
