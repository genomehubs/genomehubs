import { checkResponse } from "./checkResponse.js";
import { client } from "./connection.js";
import { processHits } from "./processHits.js";

const altRecordId = async ({ index, name, source }) => {
  const { body } = await client
    .searchTemplate(
      {
        index,
        body: { id: "taxon_by_specific_name", params: { name, source } },
        rest_total_hits_as_int: true,
      },
      { meta: true }
    )
    .catch((err) => {
      return err.meta;
    });
  let results = [];
  let status = checkResponse({ body });
  if (status.hits && status.hits > 0) {
    results = processHits({ body, reason: true });
  }
  results = results.map((result) => result.id);
  return results;
};

export const lookupAlternateIds = async ({ recordId, index }) => {
  let newIds = [];
  for (const id of recordId) {
    let match = String(id).match(/^([^\d_\:]+)[_\:]*(\d+)/);
    let source = "ncbi";
    let name = String(id);
    if (match) {
      source = match[1];
      name = match[2];
    }
    let alternateIds = await altRecordId({ index, name, source });
    newIds = newIds.concat(alternateIds);
  }
  return newIds;
};
