import { addCondition } from "./addCondition";
import { attrTypes } from "./attrTypes";
import { getRecordsByTaxon } from "./getRecordsByTaxon";
import { getResults } from "../functions/getResults";
import { parseFields } from "./parseFields";
import { summaries } from "./summaries";

const fail = (error) => {
  return {
    success: false,
    error,
  };
};

const isDate = (date) => {
  return new Date(date) !== "Invalid Date" && !isNaN(new Date(date));
};

const validateValue = (term, value, meta, types) => {
  let type = meta.type;
  let attrEnum;
  if (types && types(meta.attribute)) {
    if (!type || type == "value") {
      type = types(meta.attribute).type;
    }
  }
  if (meta.attribute == "taxonomy") {
    if (["tax_name", "tax_rank", "tax_eq", "tax_lineage"]) {
      type = "keyword";
    }
  }
  if (type == "keyword") {
    if (types && types(meta.attribute)) {
      let summary = types(meta.attribute).summary;
      if (
        summary == "enum" ||
        (Array.isArray(summary) && summary.includes("enum"))
      ) {
        attrEnum = new Set(types(meta.attribute).constraint.enum);
      }
    }
  }

  let values;
  if (type == "geo_point") {
    values = [value];
  } else {
    values = value.split(/\s*,\s*/);
  }
  for (let v of values) {
    if (type == "keyword") {
      if (attrEnum) {
        if (!attrEnum.has(v.replace(/^!/, ""))) {
          return fail(`invalid value for ${meta.attribute} in ${term}`);
        }
      }
      if (meta.attribute == "taxonomy") {
        if (meta.type == "tax_rank") {
          // TODO: check rank is valid
        }
      }
      continue;
    } else if (type == "date") {
      if (!isDate(v.replace(/^!/, ""))) {
        if (summaries.includes(type)) {
          return fail(`invalid date value for ${type} in ${term}`);
        }
        return fail(`invalid date value for ${meta.attribute} in ${term}`);
      }
    } else if (type == "geo_point") {
      let [lat, lon] = v.replaceAll("−", "-").split(",");
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        return fail(`invalid value for ${meta.attribute} in ${term}`);
      }
    } else {
      if (isNaN(v.replace(/^!/, "").replaceAll("−", "-"))) {
        if (summaries.includes(type)) {
          return fail(`invalid value for ${type} in ${term}`);
        }
        return fail(`invalid value for ${meta.attribute} in ${term}`);
      }
    }
  }
  return { success: true };
};

const validateOperator = (term, types, meta) => {
  const operators = new Set(["!=", "<", "<=", "=", "==", ">=", ">"]);
  if (term.match(/[<>=]/)) {
    let parts = term.split(/\s*([!]*[<>=]=*)\s*/);
    if (parts.length > 3 || !operators.has(parts[1])) {
      return fail(`invalid operator in ${term}`);
    }
    if (!types) {
      return { success: true };
    }
    if (!meta) {
      parts[0] = parts[0].toLowerCase();
      let fullMeta = types(parts[0]);
      if (!fullMeta) {
        return fail(`invalid field name in ${term}`);
      }
      meta = {
        attribute: fullMeta.name,
        type: fullMeta.type,
      };
    }
    return validateValue(term, parts[2], meta, types);
  }
  return { success: true };
};

const splitTerm = (term) => {
  let parts;
  let validation = { success: true };
  // if (term.match(/"/)) {
  // TODO: test for even number of quotes
  let patterns = [];
  let segments = term.split(/"/);
  if (segments.length % 2 == 0) {
    return { validation: fail(`Unmatched double quotes in ${term}`) };
  }
  let subbedTerm = segments
    .map((segment, i) => {
      if (i % 2 == 0) {
        return segment;
      }
      let pattern = `__-${i}-__`;
      patterns.push([i, pattern]);
      return pattern;
    })
    .join("");
  if (subbedTerm.match(/^[^=><]+\(/)) {
    parts = subbedTerm.match(/(.*?)\((.*)\)([^\)]*)/);
  }
  if (!parts) {
    // parts = subbedTerm.match(/()(.*?)\s*([!><=]+[^\)]*)/) || [subbedTerm];
    parts = subbedTerm.match(/()(.*?)\s*([!><=]+.*)/) || [subbedTerm];
  }
  for (let i = 0; i < 3; i++) {
    if (parts[i]) {
      for (let pattern of patterns) {
        parts[i] = parts[i].replace(pattern[1], segments[pattern[0]]);
      }
    }
  }
  return { parts, validation };
};

const validateTerm = (term, types) => {
  // if (!term.match(/^[a-z0-9<>=,!:_\s\.-~\/\(\)"]+$/)) {
  //   return fail(`invalid character in ${term}`);
  // }
  term = term.trim();
  term = term.replace(/\(\s+/, "(");
  term = term.replace(/\s+\)/, ")");
  let { parts, validation } = splitTerm(term);
  // if (term.match(/\(/)) {
  if (!validation.success) {
    return { validation };
  }
  if (parts[1] && parts[1].length > 0) {
    parts[1] = parts[1].toLowerCase();
    if (parts[1].startsWith("tax")) {
      if (!parts[1].match(/tax_(tree|name|eq|rank|depth|lineage)$/)) {
        return { validation: fail(`invalid taxonomy term in ${term}`) };
      }
      if (parts[3]) {
        return {
          validation: fail(`taxonomy term must not have operator in ${term}`),
        };
      }
      return {
        parts,
        validation: validateValue(term, parts[2], {
          attribute: "taxonomy",
          type: parts[0],
        }),
      };
    }
    if (!summaries.includes(parts[1])) {
      return { validation: fail(`invalid summary in ${term}`) };
    }
  }
  if (parts[2] && parts[2].length > 0) {
    parts[2] = parts[2].toLowerCase();
    if (types) {
      let meta = types(parts[2]);
      if (!meta) {
        return { validation: fail(`invalid attribute name in ${term}`) };
      }
      parts[2] = meta.name;
      let typeSummary = meta.summary;
      if (!Array.isArray(typeSummary)) {
        typeSummary = [typeSummary];
      }
      if (typeSummary.includes("list")) {
        typeSummary.push("length");
      }
      if (parts[1] && parts[1].length > 0 && !typeSummary.includes(parts[1])) {
        return {
          validation: fail(`invalid summary for ${parts[2]} in ${term}`),
        };
      }
    }

    return {
      parts,
      validation: validateOperator(term, types, {
        attribute: parts[2],
        type: parts[1],
      }),
    };
  }
  if (parts[0].match(/[<>=]/)) {
    return { parts, validation: validateOperator(term, types) };
  }
  return { parts, validation: { success: true } };
};

export const generateQuery = async ({
  query,
  result,
  taxonomy,
  fields,
  optionalFields,
  names,
  ranks,
  maxDepth,
  lca,
  includeEstimates,
  includeRawValues,
  searchRawValues,
  summaryValues,
  exclusions,
  size = 10,
  offset = 0,
  sortBy,
  aggs,
  req,
  update,
}) => {
  let { lookupTypes } = await attrTypes({ ...query, taxonomy });
  fields = await parseFields({ result, fields, taxonomy });
  optionalFields = optionalFields
    ? await parseFields({ result, fields: optionalFields, taxonomy })
    : [];
  if (ranks) {
    let rankNames = ranks.split(/\s*,\s*/);
    ranks = {};
    rankNames.forEach((name) => {
      ranks[name] = true;
    });
  }
  if (names) {
    let nameClasses = names.split(/\s*,\s*/);
    names = {};
    nameClasses.forEach((nameClass) => {
      names[nameClass] = true;
    });
  }
  let taxTerm, rank, depth, multiTerm, idTerm;
  let filters = {};
  let properties = {};
  let status;
  let excludeMissing = new Set();
  if (query && query.match(/\n/) && query.split(/\n/)[1] > "") {
    multiTerm = query
      .toLowerCase()
      .split(/\n/)
      .map((v) => v.trim())
      .filter((v) => v > "");
  } else if (query) {
    query = query.trim();
    if (result != "file") {
      query = query.toLowerCase();
    }
    for (let term of query.split(/\s+and\s+/)) {
      let parts, validation;
      try {
        ({ parts, validation } = validateTerm(term, lookupTypes[result]));
      } catch (err) {
        validation = fail(`unable to validate query term ${term}`);
        console.warn(err);
      }
      if (!validation.success) {
        return {
          func: () => ({
            status: validation,
          }),
          params: {},
        };
      }

      if (parts[1] && parts[1].startsWith("tax_")) {
        if (parts[1] == "tax_rank") {
          rank = parts[2];
        } else if (parts[1] == "tax_depth") {
          depth = parts[2];
        } else {
          parts[1] = parts[1].replace(/tax_/, "");
          taxTerm = parts;
        }
      } else {
        if (parts.length > 1) {
          if (lookupTypes[result]) {
            let meta = lookupTypes[result](term);
            if (meta) {
              let bins = meta.bins;
              if (bins && bins.scale && bins.scale.startsWith("log")) {
                if (!parts[3] || parts[3].length > 0) {
                  parts[3] = ">0";
                }
              }
              term = meta.name;
            }
          }
          let summary;
          if (parts[1] && parts[1].length > 0) {
            summary = parts[1];
          }
          if (parts[3].match(/[\>\<=]/)) {
            let condition = parts[3].split(/\s*([\>\<=]+)\s*/);
            if (condition[0].endsWith("!")) {
              condition[1] = `!${condition[1]}`;
            }
            parts[3] = condition[1];
            parts[4] = condition[2];
            if (lookupTypes[result]) {
              let meta = lookupTypes[result](parts[2]);
              if (!meta) {
                status = {
                  success: false,
                  error: `Invalid field in '${term}'`,
                };
              } else {
                parts[2] = meta.name;
                filters = addCondition(filters, parts, meta.type, summary);
              }
            } else {
              properties = addCondition(properties, parts, "keyword");
            }
          } else {
            let meta = lookupTypes[result](parts[2]);
            if (meta) {
              parts[2] = meta.name;
              fields.push(parts[2]);
            } else {
              idTerm = parts[2];
            }
          }
        } else {
          let meta = lookupTypes[result](term);
          if (meta) {
            term = meta.name;
            excludeMissing.add(meta.name);
            fields.push(term);
          } else {
            idTerm = term;
          }
        }
      }
    }
  }

  if (status) {
    return {
      func: () => ({
        status,
      }),
      params: {},
    };
  }

  if (excludeMissing) {
    if (!exclusions) {
      exclusions = {};
    }
    if (exclusions.missing) {
      exclusions.missing.forEach(excludeMissing.add, excludeMissing);
    }
    exclusions.missing = [...excludeMissing];
  }

  let params = {
    idTerm,
    result,
    fields,
    optionalFields,
    names,
    ranks,
    depth,
    maxDepth,
    lca,
    ancestral: false,
    includeEstimates,
    includeRawValues,
    searchRawValues,
    filters,
    properties,
    exclusions,
    rank,
    summaryValues,
    size,
    offset,
    sortBy,
    aggs,
    req,
    update,
    taxonomy,
  };
  if (taxTerm) {
    let function_score;
    taxTerm[2] = taxTerm[2]
      .split(",")
      .map((part) => part.replace(/^(\w+)\[.*\]$/, "$1"))
      .join(",");
    if (taxTerm[1] == "lineage") {
      // convert search term to list of tax names
      // set ordered parameter to keep order
      let res = await getResults({
        ...params,
        taxonomy,
        fields: ["lineage"],
        query: `tax_name(${taxTerm[2]})`,
        exclusions: [],
        size: 100,
        offset: 0,
      });
      if (!res.status.success) {
        return {};
      }
      let taxIds = [];
      for (let rslt of res.results) {
        let line = rslt.result.lineage;
        if (line) {
          for (let anc of line) {
            taxIds.push(anc.taxon_id);
          }
        }
      }
      taxTerm[1] = "eq";
      taxIds = [...new Set(taxIds)];
      taxTerm[2] = taxIds.join(",");
      function_score = {
        query: { match_all: {} },
        boost: 5,
        functions: taxIds.reverse().map((taxId, index) => ({
          filter: { match: { taxon_id: taxId } },
          weight: (index + 1) * 2,
        })),
        score_mode: "max",
        boost_mode: "replace",
      };
    }
    if (taxTerm[1] == "eq") {
      return {
        func: getRecordsByTaxon,
        params: {
          ...params,
          function_score,
          searchTerm: taxTerm[2],
          includeEstimates: true,
        },
      };
    } else if (taxTerm[1] == "name") {
      return {
        func: getRecordsByTaxon,
        params: {
          ...params,
          searchTerm: taxTerm[2],
          includeEstimates: true,
        },
      };
    } else if (taxTerm[1] == "tree") {
      return {
        func: getRecordsByTaxon,
        params: {
          ...params,
          searchTerm: taxTerm[2],
          ancestral: true,
        },
      };
    }
  } else if (multiTerm) {
    return {
      func: getRecordsByTaxon,
      params: {
        ...params,
        multiTerm,
      },
    };
  } else {
    return {
      func: getRecordsByTaxon,
      params: {
        ...params,
        searchTerm: false,
        ancestral: true,
      },
    };
  }
};
