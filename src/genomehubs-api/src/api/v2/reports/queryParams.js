import { attrTypes } from "../functions/attrTypes.js";
import { summaries } from "../functions/summaries.js";

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
  let nullFields = [];
  if (params.query) {
    if (
      (result == "taxon" || result == "assembly" || result == "sample") &&
      rank
    ) {
      params.query += ` AND tax_rank(${rank})`;
    }
    // params.includeEstimates = true;
    // params.excludeAncestral = [];
    params.excludeMissing = [];

    term.split(/\s+(?:and|AND)\s+/).forEach((subterm) => {
      if (!subterm.match("tax_")) {
        let [field, value] = subterm.split(/(?:=|!=|<=|>=|<|>)/);
        field = field.replace(/[^\w_\(\)-].+$/, "").toLowerCase();
        if (value && value.split(/\s*,\s*/).includes("null")) {
          nullFields.push(field);
        }
        let fieldMeta = lookupTypes(field);
        let summary = fieldMeta ? fieldMeta.return_type || "value" : "value";
        if (field.match(/\(/)) {
          [summary, field] = field.split(/[\(\)]/);
          if (summary != "collate") {
            fieldMeta = lookupTypes(field);
          }
        }
        if (fieldMeta) {
          field = fieldMeta.name;

          params.excludeMissing.push(field);
          fields.push(field);
          if (summary != "collate") {
            summaries.push(summary);
          }
        }
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
    let [summary, attr] = field.split(/[\(\)]/);
    if (attr && summaries.includes(summary)) {
      field = attr;
    }
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
  params.nullFields = [...new Set(nullFields)];

  return { params, fields, summaries };
};
