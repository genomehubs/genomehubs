import { addCondition } from "./addCondition";
import { attrTypes } from "./attrTypes";
import { getRecordsByTaxon } from "./getRecordsByTaxon";
import { parseFields } from "./parseFields";
import { summaries } from "./summaries";

const fail = (error) => {
  return {
    success: false,
    error,
  };
};

const validateValue = (term, value, meta, types) => {
  let type = meta.type;
  let attrEnum;
  if (types && types[meta.attribute]) {
    if (type == "value") {
      type = types[meta.attribute].type;
    }
  }
  if (meta.attribute == "taxonomy") {
    if (["tax_name", "tax_rank", "tax_eq"]) {
      type = "keyword";
    }
  }
  if (type == "keyword") {
    if (types && types[meta.attribute]) {
      let summary = types[meta.attribute].summary;
      if (
        summary == "enum" ||
        (Array.isArray(summary) && summary.includes("enum"))
      ) {
        attrEnum = new Set(types[meta.attribute].constraint.enum);
      }
    }
  }

  let values = value.split(/\s*,\s*/);
  for (let v of values) {
    if (type == "keyword") {
      if (attrEnum) {
        if (!attrEnum.has(v.replace(/^!/, ""))) {
          return fail(`invalid value for ${meta.attribute} in ${term}`);
        }
      }
      if (meta.attribute == "taxonomy") {
        if ((meta.type = "tax_rank")) {
          // TODO: check rank is valid
        }
      }
      continue;
    }
    if (isNaN(v.replace(/^!/, ""))) {
      if (summaries.includes(type)) {
        return fail(`invalid value for ${type} in ${term}`);
      }
      return fail(`invalid value for ${meta.attribute} in ${term}`);
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
    if (!meta) {
      parts[0] = parts[0].toLowerCase();
      if (!types[parts[0]]) {
        return fail(`invalid field name in ${term}`);
      }
      meta = {
        attribute: parts[0],
        type: types[parts[0]].type,
      };
    }
    return validateValue(term, parts[2], meta, types);
  }
};

const validateTerm = (term, types) => {
  if (!term.match(/^[a-z0-9<>=,!:_\s\/\(\)]+$/)) {
    return fail(`invalid character in ${term}`);
  }
  term = term.trim();
  term = term.replace(/\(\s+/, "(");
  term = term.replace(/\s+\)/, ")");
  if (term.match(/\(/)) {
    if (!term.match(/^[^\(]+\([^\(\)]+\)[^\(]*$/)) {
      return fail(`invalid parentheses in ${term}`);
    }
    let parts = term.split(/\s*[\(\)]\s*/);
    parts[0] = parts[0].toLowerCase();
    if (parts[0].startsWith("tax")) {
      if (!parts[0].match(/tax_(tree|name|eq|rank|depth)$/)) {
        return fail(`invalid taxonomy term in ${term}`);
      }
      if (parts[2]) {
        return fail(`taxonomy term must not have operator in ${term}`);
      }
      return validateValue(term, parts[1], {
        attribute: "taxonomy",
        type: parts[0],
      });
    }
    if (!summaries.includes(parts[0])) {
      return fail(`invalid summary in ${term}`);
    }
    parts[1] = parts[1].toLowerCase();
    if (!types[parts[1]]) {
      return fail(`invalid attribute name in ${term}`);
    }
    let typeSummary = types[parts[1]].summary;
    if (!Array.isArray(typeSummary)) {
      typeSummary = [typeSummary];
    }
    if (typeSummary.includes("list")) {
      typeSummary.push("length");
    }
    if (!typeSummary.includes(parts[0])) {
      return fail(`invalid summary for ${parts[1]} in ${term}`);
    }
    return validateOperator(term, types, {
      attribute: parts[1],
      type: parts[0],
    });
  }
  if (term.match(/[<>=]/)) {
    return validateOperator(term, types);
  }
  return { success: true };
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
  let typesMap = await attrTypes({ ...query, taxonomy });
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
  if (query && query.match(/\n/)) {
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
      let validation = validateTerm(term, typesMap[result]);
      if (!validation.success) {
        return {
          func: () => ({
            status: validation,
          }),
          params: {},
        };
      }
      let taxQuery = term.match(/tax_(tree|name|eq|rank|depth)\(\s*(.+?)\s*\)/);
      if (taxQuery) {
        if (taxQuery[1] == "rank") {
          rank = taxQuery[2];
        } else if (taxQuery[1] == "depth") {
          depth = taxQuery[2];
        } else {
          taxTerm = taxQuery;
        }
      } else {
        if (typesMap[result] && typesMap[result][term]) {
          let bins = typesMap[result][term].bins;
          if (bins && bins.scale && bins.scale.startsWith("log")) {
            term += " > 0";
          }
        }
        let summary, field;
        if (term.match(/(\w+)\s*\(/)) {
          [summary, field] = term.split(/\s*[\(\)]\s*/);
          if (!summaries.includes(summary)) {
            status = { success: false, error: `Invalid option in '${term}'` };
          }
        }
        if (term.match(/[\>\<=]/)) {
          let parts = term.split(/\s*([\>\<=]+)\s*/);
          if (parts[0].endsWith("!")) {
            parts[0] = parts[0].replace("!", "");
            parts[1] = `!${parts[1]}`;
          }
          if (!field) field = parts[0];
          if (typesMap[result]) {
            if (!typesMap[result][field]) {
              status = { success: false, error: `Invalid field in '${term}'` };
            } else {
              filters = addCondition(
                filters,
                parts,
                typesMap[result][field].type,
                summary
              );
            }
          } else {
            properties = addCondition(properties, parts, "keyword");
          }
        } else {
          if (typesMap[result][term]) {
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
    if (taxTerm[1] == "eq") {
      return {
        func: getRecordsByTaxon,
        params: {
          ...params,
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
