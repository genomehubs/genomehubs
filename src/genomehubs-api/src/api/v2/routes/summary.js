import { aggregateRawValuesByTaxon } from "../queries/aggregateRawValuesByTaxon.js";
import { attrTypes } from "../functions/attrTypes.js";
import { checkResponse } from "../functions/checkResponse.js";
import { client } from "../functions/connection.js";
import { formatJson } from "../functions/formatJson.js";
import { indexName } from "../functions/indexName.js";
import { logError } from "../functions/logger.js";

const getSummary = async ({ query: params, ...req }) => {
  let { typesMap, lookupTypes } = await attrTypes({ ...params });
  let index = indexName({ ...params });
  let ids = Array.isArray(params.recordId)
    ? params.recordId
    : [params.recordId];
  if (params.result == "taxon") {
    ids = ids.map((id) => id.replace(/^taxon-/, ""));
  }
  let fields = (params.fields || "").split(/\s*,\s*/);
  if (!fields || fields == "all") {
    // TODO: standardise handling of fields == "all"
    fields = Object.values(typesMap)
      .filter((meta) => meta.display_level == 1)
      .map((meta) => meta.name);
  } else {
    let fieldList = new Set();
    for (let field of fields) {
      let meta = lookupTypes(field);
      if (meta) {
        fieldList.add(meta.name);
      }
    }
    fields = [...fieldList];
  }
  const query = await aggregateRawValuesByTaxon({
    lineage: ids[0],
    result: params.result,
    field: fields[0],
    summary: params.summary[0],
    taxonomy: params.taxonomy,
  });
  const { body } = await client
    .search(
      {
        index,
        body: query,
        rest_total_hits_as_int: true,
      },
      { meta: true }
    )
    .catch((message) => {
      logError({ req, message });
      return message.meta;
    });
  let summaries = [];
  let status = checkResponse({ body });
  if (status.hits) {
    summaries = [
      {
        name: params.summary[0],
        field: fields[0],
        lineage: ids[0],
        taxonomy: params.taxonomy,
        meta: typesMap[fields[0]],
        summary:
          body.aggregations.attributes[fields[0]].summary[params.summary[0]],
      },
    ];
  }
  return { status, summaries };
};

export const getFieldSummary = async (req, res) => {
  try {
    let response = {};
    response = await getSummary(req);
    return res.status(200).send(formatJson(response, req.query.indent));
  } catch (message) {
    logError({ req, message });
    return res.status(400).send({ status: "error" });
  }
};
