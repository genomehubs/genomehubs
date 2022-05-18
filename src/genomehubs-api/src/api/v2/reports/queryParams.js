import { attrTypes } from "../functions/attrTypes";

export const queryParams = async ({
  term,
  result,
  rank,
  taxonomy,
  includeEstimates = false,
}) => {
  let { lookupTypes } = await attrTypes({ result, taxonomy });
  let params = {
    result,
    query: term,
    taxonomy,
    includeEstimates,
  };
  let fields = [];
  let summaries = [];
  if (params.query) {
    if ((result == "taxon" || result == "assembly") && rank) {
      params.query += ` AND tax_rank(${rank})`;
    }
    // params.includeEstimates = true;
    // params.excludeAncestral = [];
    params.excludeMissing = [];

    term.split(/\s+(?:and|AND)\s+/).forEach((subterm) => {
      if (!subterm.match("tax_")) {
        let field = subterm.replace(/[^\w_\(\)-].+$/, "").toLowerCase();
        let summary = "value";
        if (field.match(/\(/)) {
          [summary, field] = field.split(/[\(\)]/);
        }
        let fieldMeta = lookupTypes(field);
        field = fieldMeta.name;
        params.excludeMissing.push(field);
        fields.push(field);
        summaries.push(summary);
      }
    });
  } else {
    params.includeEstimates = true;
    if (rank) {
      params.query = `tax_rank(${rank})`;
    }
  }
  let fieldList = new Set();
  for (let field of fields) {
    let meta = lookupTypes(field);
    if (meta) {
      fieldList.add(meta.name);
    }
  }
  fields = [...fieldList];
  params.excludeMissing = [...new Set(params.excludeMissing)];
  params.excludeAncestral = [...new Set(params.excludeAncestral)];
  params.excludeDirect = [...new Set(params.excludeDirect)];
  params.excludeDescendant = [...new Set(params.excludeDescendant)];

  return { params, fields, summaries };
};
