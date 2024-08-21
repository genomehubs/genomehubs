import {
  getBrowseStatus,
  getCurrentRecord,
  getRecords,
  receiveRecord,
  requestRecord,
  resetRecord,
  setBrowse,
} from "../reducers/record";

import { apiUrl } from "../reducers/api";
import { createSelector } from "reselect";
import { getCurrentTaxonomy } from "../reducers/taxonomy";
import store from "../store";

export const getLineage = createSelector(getCurrentRecord, (record) => {
  if (!record || !record.record) {
    return undefined;
  }
  return {
    taxon: {
      taxon_id: record.record.taxon_id,
      scientific_name: record.record.scientific_name,
      taxon_rank: record.record.taxon_rank,
    },
    lineage: record.record.lineage,
  };
});

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

export const updateBrowse = (parents) => {
  return async function (dispatch) {
    const state = store.getState();
    const data = getBrowseStatus(state);
    dispatch(setBrowse(immutableUpdate(parents, data)));
  };
};
