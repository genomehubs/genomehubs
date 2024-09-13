import { attrTypes } from "./attrTypes.js";
import { checkDocResponse } from "./checkDocResponse.js";
import { client } from "./connection.js";
import { indexName } from "./indexName.js";
import { lookupAlternateIds } from "./lookupAlternateIds.js";
import { processDoc } from "./processDoc.js";
import { types } from "util";

const convertIdsToDocIds = (recordId, result) => {
  /**
   * Converts a set of entry IDs into document IDs
   * @param {string|Array} recordId - One or more record IDs.
   * @param {string} result - The index type.
   */
  let ids;
  if (Array.isArray(recordId)) {
    ids = recordId;
  } else {
    ids = recordId.split(",");
  }
  if (result == "taxon") {
    // TODO: #186 standardise doc id prefixes
    ids = ids.map((id) =>
      id.match(/^taxon-/)
        ? id
        : id.match(/^taxon_id-/)
        ? id.replace(/^taxon_id/, "taxon")
        : `taxon-${id}`
    );
  } else if (result == "assembly") {
    ids = ids.map((id) => (id.match(/^assembly-/) ? id : `assembly-${id}`));
  } else if (result == "sample") {
    ids = ids.map((id) => (id.match(/^sample-/) ? id : `sample-${id}`));
  } else if (result == "feature") {
    ids = ids.map((id) => (id.match(/^feature-/) ? id : `feature-${id}`));
  } else if (result == "analysis") {
    ids = ids.map((id) => (id.match(/^analysis-/) ? id : `analysis-${id}`));
  } else if (result == "file") {
    ids = ids.map((id) => (id.match(/^file-/) ? id : `file-${id}`));
  }
  return ids;
};

export const getRecordsById = async ({
  recordId,
  result,
  groups,
  taxonomy,
  hub,
  release,
  iteration = 0,
}) => {
  /**
   * Get specified records from an index by entry or document ID.
   * @param {Object} recordInfo Information about the record.
   * @param {string|Array} recordInfo.recordId - One or more record IDs.
   * @param {string} recordInfo.result - The index type.
   * @param {string} recordInfo.taxonomy - Backbone taxonomy name.
   * @param {string} recordInfo.hub - Hub name.
   * @param {string} recordInfo.release - Hub release version.
   */
  let opts = {};
  if (groups) {
    opts.groups = groups.split(",");
    let { typesMap } = await attrTypes({ result, taxonomy });
    opts.fields = [];
    Object.entries(typesMap).forEach(([key, type]) => {
      if (type.display_group && opts.groups.includes(type.display_group)) {
        opts.fields.push(key);
      }
    });
  }
  let index = indexName({ result, taxonomy, hub, release });
  let ids = convertIdsToDocIds(recordId, result);
  const { body } = await client
    .mget(
      {
        index,
        body: { ids },
      },
      { meta: true }
    )
    .catch((err) => {
      return err.meta;
    });
  let status = checkDocResponse({ body });
  let records = [];
  if (status.hits) {
    body.docs.forEach((doc) => {
      let obj = { id: doc._id, index: doc._index, found: doc.found };
      if (doc.found && doc._source) {
        obj.record = processDoc({ doc: doc._source, opts });
        obj.record.record_id = obj.record[`${result}_id`];
        records.push(obj);
      }
    });
  }
  iteration++;
  if (records.length == 0 && iteration == 1) {
    let newIds = await lookupAlternateIds({ recordId, index });
    if (newIds.length > 0) {
      let alt = await getRecordsById({
        recordId: newIds,
        result,
        groups,
        taxonomy,
        hub,
        release,
        iteration: 2,
      });
      status = alt.status;
      records = alt.records;
    }
  }
  return { status, records };
};
