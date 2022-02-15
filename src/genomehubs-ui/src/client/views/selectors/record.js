import { createSelector } from "reselect";
import { createCachedSelector } from "re-reselect";
import store from "../store";
import {
  getCurrentRecord,
  // requestLineage,
  // receiveLineage,
} from "../reducers/record";

export const getLineage = createSelector(getCurrentRecord, (record) => {
  if (!record || !record.record) return undefined;
  let lineage = {
    taxon: {
      taxon_id: record.record.taxon_id,
      scientific_name: record.record.scientific_name,
      taxon_rank: record.record.taxon_rank,
    },
    lineage: record.record.lineage,
  };

  return lineage;
});
