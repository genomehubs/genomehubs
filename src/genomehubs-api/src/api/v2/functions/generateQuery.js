import { addCondition } from "./addCondition";
import { attrTypes } from "./attrTypes";
import { getRecordsByTaxon } from "./getRecordsByTaxon";
import { parseFields } from "./parseFields";
import { summaries } from "./summaries";

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
    query.split(/\s+and\s+/).forEach((term) => {
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
    });
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
