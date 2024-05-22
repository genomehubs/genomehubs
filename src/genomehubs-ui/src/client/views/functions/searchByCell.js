import qs from "./qs";

const updateField = ({
  field,
  summary,
  parts,
  valueType,
  bounds,
  range = bounds.domain,
  xRange,
}) => {
  let terms = [];
  let tre;
  if (valueType == "lineage") {
    tre = new RegExp(`tax_tree\\(.+?\\)`);
    terms.push(`tax_tree(${range[0]})`);
    if (bounds.cat) {
      field = bounds.cat;
      range[0] = bounds.cats.map((o) => o.key).join(",");
    } else {
      field = undefined;
    }
  }
  if (field) {
    let f = summary && summary != "value" ? `${summary}(${field})` : field;
    let re;
    if (valueType != "coordinate") {
      re = new RegExp(f == field ? `\\b${f}\\b` : `${summary}\\(${field}\\)`);
    }
    let index = parts.findIndex((p) => p.match(re));
    for (let part of parts) {
      if ((!re || !part.match(re)) && (!tre || !part.match(tre))) {
        terms.push(part);
      }
    }
    let newTerms = [];
    if (valueType == "coordinate") {
      // TODO: check this
      newTerms.push(`sequence_id = ${xRange},${range}`);
      let collateIndex = terms.findIndex((t) => t.startsWith("collate"));
      terms[collateIndex] = terms[collateIndex].replace(
        "collate(assembly_id,",
        "collate(sequence_id,"
      );
    } else if (valueType == "date") {
      newTerms.push(
        `${field} >= ${new Date(range[0]).toISOString().split(/t/i)[0]}`
      );
      newTerms.push(
        `${field} < ${new Date(range[1]).toISOString().split(/t/i)[0]}`
      );
      // } else if (valueType == "keyword" && field == bounds.field) {
      //   let val = bounds.stats.cats[range[0]].key;
      //   if (val == "other") {
      //     let list = [];
      //     for (let obj of bounds.stats.cats) {
      //       if (obj.key != "other") {
      //         list.push(obj.key);
      //       }
      //     }
      //     query += ` AND ${field} != ${list.join(",")}`;
      //   } else {
      //     query += ` AND ${field} = ${val}`;
      //   }
    } else if (bounds.scale == "ordinal") {
      if (range[0] == "other") {
        newTerms.push(
          `${f} != ${bounds.stats.cats
            .filter((o) => o.key != "other")
            .map((o) => o.key)
            .join(",")}`
        );
      } else if (
        valueType == "keyword" &&
        bounds?.stats?.cats &&
        bounds.stats.cats.length >= range[0]
      ) {
        newTerms.push(`${f} = ${bounds.stats.cats[range[0]].key}`);
      } else {
        newTerms.push(`${f} = ${range[0]}`);
      }
    } else {
      newTerms.push(`${f} >= ${range[0]}`);
      newTerms.push(`${f} < ${range[1]}`);
    }
    terms = index == 0 ? [...newTerms, ...terms] : [...terms, ...newTerms];
  }
  return terms;
};

const updateOpts = (opts = "") => {
  opts = opts.split(";");
  if (opts.length == 1) {
    opts = opts[0].split(",");
  }
  if (opts.length > 1) {
    opts[0] = "";
    opts[1] = "";
  }
  return opts.join(";");
};

const updateExclusions = (options) => {
  for (let key of [
    "excludeAncestral",
    "excludeDescendant",
    "excludeDirect",
    "excludeMissing",
  ]) {
    if (options[key]) {
      delete options[key];
    }
  }
};

export const searchByCell = ({
  xQuery,
  summary,
  xBounds,
  bounds,
  location,
  navigate,
  fields,
  valueType,
  ranks,
  basename,
  yQuery,
  report = "histogram",
  xRange,
  yRange,
  yBounds,
  yValueType,
  ySummary,
  ...props
}) => {
  // TODO: test with boat oxford plot
  let { field } = bounds;
  let parts = xQuery.query.split(/\s*AND\s*/gi);
  let terms = updateField({
    field,
    summary,
    parts,
    valueType,
    bounds,
    range: xRange,
    xRange: yRange,
  });
  if (bounds.by == "lineage" && !bounds.showOther) {
    terms.push(`tax_tree(${bounds.cats.map((o) => o.key).join(",")})`);
  }
  if (yQuery) {
    terms = updateField({
      field: yBounds.field,
      summary: ySummary,
      parts: [...terms],
      valueType: yValueType,
      bounds: yBounds,
      range: yRange,
      xRange,
    });
  }
  let query = terms.join(" AND ");

  let options = qs.parse(location.search.replace(/^\?/, ""));
  if (options.sortBy && !fields.includes(options.sortBy)) {
    delete options.sortBy;
    delete options.sortOrder;
  }
  options.offset = 0;
  fields = fields.join(",");
  if (ranks) {
    ranks = ranks.join(",");
  } else {
    ranks = "";
  }
  updateExclusions(xQuery);
  let xOpts = updateOpts(options.xOpts);

  let queryString = qs.stringify({
    ...xQuery,
    ...options,
    xOpts,
    query,
    ...(yQuery && { y: yQuery.query }),
    fields,
    report,
    ranks,
  });
  navigate(
    `${basename}/search?${queryString.replace(/^\?/, "")}#${encodeURIComponent(
      query
    )}`
  );
};

export default searchByCell;
