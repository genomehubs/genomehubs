import { createAction, handleAction, handleActions } from "redux-actions";

import { createSelector } from "reselect";
import { getCurrentTaxonomy } from "../reducers/taxonomy";
import immutableUpdate from "immutable-update";
import { setApiStatus } from "./api";
import store from "../store";

const apiUrl = API_URL || "/api/v1";

const requestRecord = createAction("REQUEST_RECORD");
const receiveRecord = createAction(
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

  const updatedWithRecord = immutableUpdate(updatedWithRecordList, {
    isFetching: false,
    status,
    lastUpdated: meta.receivedAt,
  });

  return updatedWithRecord;
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

export function fetchRecord(recordId, result, taxonomy, callback) {
  return async function (dispatch) {
    const state = store.getState();
    const records = getRecords(state);
    if (records[recordId]) {
      return;
    }
    if (!taxonomy) {
      taxonomy = getCurrentTaxonomy(state);
    }
    dispatch(requestRecord());
    let url = `${apiUrl}/record?recordId=${recordId}&result=${result}&taxonomy=${taxonomy}`;
    try {
      let json;
      try {
        const response = await fetch(url);
        json = await response.json();
      } catch (error) {
        json = console.log("An error occured.", error);
      }
      let fetchedRecordId = json.records[0].record.taxon_id;
      let fetchedTitle = json.records[0].record.scientific_name;
      if (result == "assembly") {
        fetchedRecordId = json.records[0].record.assembly_id;
        fetchedTitle = fetchedRecordId;
      }
      if (fetchedRecordId == recordId) {
        dispatch(receiveRecord(json));
      } else if (callback) {
        dispatch(resetRecord());
        callback(fetchedRecordId, result, taxonomy, fetchedTitle);
      }
    } catch (err) {
      return dispatch(setApiStatus(false));
    }
  };
}

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

export const recordReducers = {
  records,
  currentRecordId,
};
