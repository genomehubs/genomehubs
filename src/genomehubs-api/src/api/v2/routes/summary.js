import { aggregateRawValuesByTaxon } from "../queries/aggregateRawValuesByTaxon";
import { attrTypes } from "../functions/attrTypes";
import { checkResponse } from "../functions/checkResponse";
import { client } from "../functions/connection";
import { formatJson } from "../functions/formatJson";
import { indexName } from "../functions/indexName";

const getSummary = async (params) => {
  let typesMap = await attrTypes({ ...params });
  let index = indexName({ ...params });
  let ids = Array.isArray(params.recordId)
    ? params.recordId
    : [params.recordId];
  if (params.result == "taxon") {
    ids = ids.map((id) => id.replace(/^taxon_id-/, ""));
  }
  let fields = [];
  if (!fields || fields == "all") {
    fields = Object.keys(typesMap);
  } else {
    fields = params.fields.split(/\s*,\s*/);
  }
  fields.filter((field) => Object.keys(typesMap).includes(field));
  const query = await aggregateRawValuesByTaxon({
    lineage: ids[0],
    result: params.result,
    field: fields[0],
    summary: params.summary[0],
    taxonomy: params.taxonomy,
  });
  const { body } = await client
    .search({
      index,
      body: query,
      rest_total_hits_as_int: true,
    })
    .catch((err) => {
      return err.meta;
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

module.exports = {
  getFieldSummary: async (req, res) => {
    let response = {};
    response = await getSummary(req.query);
    return res.status(200).send(formatJson(response, req.query.indent));
  },
};
