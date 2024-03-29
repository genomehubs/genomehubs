import { createAction, handleAction, handleActions } from "redux-actions";

import { apiUrl } from "./api";
import createCachedSelector from "re-reselect";
import { createSelector } from "reselect";
import { getCurrentTaxonomy } from "../reducers/taxonomy";
import immutableUpdate from "immutable-update";
import { setApiStatus } from "./api";
import store from "../store";

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

export const getRecordById = createCachedSelector(
  getRecords,
  (_state, taxonId) => taxonId,
  (records, taxonId) => {
    return records[taxonId];
  }
)((_state, taxonId) => taxonId);

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
    let url = `${apiUrl}/record?recordId=${encodeURIComponent(
      recordId
    )}&result=${result}&taxonomy=${taxonomy}`;
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
      } else if (result == "feature") {
        fetchedRecordId = json.records[0].record.feature_id;
        fetchedTitle = fetchedRecordId;
      } else if (result == "sample") {
        fetchedRecordId = json.records[0].record.sample_id;
        fetchedTitle = fetchedRecordId;
      }
      if (fetchedRecordId == recordId) {
        dispatch(receiveRecord(json));
      } else if (callback) {
        dispatch(resetRecord());
        callback(fetchedRecordId, result, taxonomy, fetchedTitle);
      } else {
        dispatch(
          receiveRecord({
            status: json.status,
            records: [{ record: { record_id: recordId } }],
          })
        );
      }
      // dispatch(setApiStatus(true));
    } catch (err) {
      dispatch(
        receiveRecord({
          status: { success: false },
          records: [{ record: { record_id: recordId } }],
        })
      );
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

export const updateBrowse = (parents) => {
  return async function (dispatch) {
    const state = store.getState();
    const data = getBrowseStatus(state);
    dispatch(setBrowse(immutableUpdate(parents, data)));
  };
};

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
