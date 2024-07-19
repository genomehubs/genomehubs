import { createAction, handleAction, handleActions } from "redux-actions";

import createCachedSelector from "re-reselect";
import { createSelector } from "reselect";
import immutableUpdate from "immutable-update";

export const requestRecord = createAction("REQUEST_RECORD");
export const receiveRecord = createAction(
  "RECEIVE_RECORD",
  (json) => json,
  () => ({ receivedAt: Date.now() })
);
export const resetRecord = createAction("RESET_RECORD");

const defaultState = () => ({
  isFetching: false,
  allIds: [],
  byId: {},
});

function onReceiveRecord(state, action) {
  const { payload, meta } = action;
  const { status, records } = payload;
  const record = records[0];
  const id = record.record.record_id;

  const updatedWithRecordState = immutableUpdate(state, {
    byId: { [id]: record },
  });

  const updatedWithRecordList = immutableUpdate(updatedWithRecordState, {
    allIds: [...new Set(updatedWithRecordState.allIds.concat(id))],
  });

  return immutableUpdate(updatedWithRecordList, {
    isFetching: false,
    status,
    lastUpdated: meta.receivedAt,
  });
}

const records = handleActions(
  {
    REQUEST_RECORD: (state, action) =>
      immutableUpdate(state, {
        isFetching: true,
      }),
    RECEIVE_RECORD: onReceiveRecord,
    RESET_RECORD: defaultState,
  },
  defaultState()
);

export const getRecords = (state) => state.records.byId;
export const getRecordIsFetching = (state) => state.records.isFetching;

export const getRecordById = createCachedSelector(
  getRecords,
  (_state, taxonId) => taxonId,
  (records, taxonId) => {
    return records[taxonId];
  }
)((_state, taxonId) => taxonId);

export const setCurrentRecordId = createAction("SET_CURRENT_RECORD_ID");
export const currentRecordId = handleAction(
  "SET_CURRENT_RECORD_ID",
  (state, action) => action.payload,
  ""
);
export const getCurrentRecordId = (state) => state.currentRecordId;

export const getCurrentRecord = createSelector(
  getRecords,
  getCurrentRecordId,
  (records, recordId) => {
    if (!recordId || !records[recordId]) {
      return {};
    }
    return records[recordId];
  }
);

export const setAttributeSettings = createAction("SET_ATTRIBUTE_SETTINGS");
export const attributeSettings = handleAction(
  "SET_ATTRIBUTE_SETTINGS",
  (state, action) => ({ ...state, ...action.payload }),
  {
    showAttribute: false,
  }
);
export const getAttributeSettings = (state) => state.attributeSettings;

export const setBrowse = createAction("SET_BROWSE");
export const browse = handleAction(
  "SET_BROWSE",
  (state, action) => {
    return action.payload;
  },
  {}
);
export const getBrowse = (state) => state.browse;

export const setBrowseStatus = createAction("SET_BROWSE_STATUS");
export const browseStatus = handleAction(
  "SET_BROWSE_STATUS",
  (state, action) => {
    let { id, value } = action.payload;
    return immutableUpdate(state, {
      [id]: value,
    });
  },
  {}
);
export const getBrowseStatus = (state) => state.browseStatus;

export const recordReducers = {
  records,
  browse,
  browseStatus,
  currentRecordId,
  attributeSettings,
};
