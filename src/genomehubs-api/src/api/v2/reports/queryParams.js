export const queryParams = ({
  term,
  result,
  rank,
  taxonomy,
  includeEstimates = false,
}) => {
  let params = {
    result,
    query: term,
    taxonomy,
    includeEstimates,
  };
  let fields = [];
  let summaries = [];
  if (params.query) {
    if (result == "taxon" && rank) {
      params.query += ` AND tax_rank(${rank})`;
    }
    // params.includeEstimates = true;
    // params.excludeAncestral = [];
    // params.excludeMissing = [];

    term.split(/\s+(?:and|AND)\s+/).forEach((subterm) => {
      if (!subterm.match("tax_")) {
        let field = subterm.replace(/[^\w_\(\)].+$/, "").toLowerCase();
        let summary = "value";
        if (field.match(/\(/)) {
          [summary, field] = field.split(/[\(\)]/);
        }
        // params.excludeAncestral.push(field);
        // params.excludeMissing.push(field);
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
  params.excludeMissing = [...new Set(params.excludeMissing)];
  params.excludeAncestral = [...new Set(params.excludeAncestral)];
  params.excludeDirect = [...new Set(params.excludeDirect)];
  params.excludeDescendant = [...new Set(params.excludeDescendant)];

  return { params, fields, summaries };
};
