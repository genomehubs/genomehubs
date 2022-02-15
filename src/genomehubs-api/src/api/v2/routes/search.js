import { clearProgress, setProgress } from "../functions/progress";

import { attrTypes } from "../functions/attrTypes";
import { formatCsv } from "../functions/formatCsv";
import { formatJson } from "../functions/formatJson";
import { getRecordsByTaxon } from "../functions/getRecordsByTaxon";
import { indexName } from "../functions/indexName";
import { lookupAlternateIds } from "../functions/lookupAlternateIds";

const operations = (str) => {
  const translate = {
    ">": ["gt"],
    ">=": ["gte"],
    "<": ["lt"],
    "<=": ["lte"],
    "=": ["gte", "lte"],
    "!=": ["ne", "gte", "lte"],
  };
  let operator = translate[str];
  return operator || [];
};
export const parseFields = async ({ result, fields, taxonomy }) => {
  let typesMap = await attrTypes({ result, taxonomy });
  try {
    if (!typesMap) {
      return [];
    }
    if (!fields || fields == "undefined") {
      fields = Object.keys(typesMap)
        .map((key) => key.toLowerCase())
        .filter((key) => typesMap[key] && typesMap[key].display_level == 1);
    } else if (!fields || fields == "all") {
      fields = Object.keys(typesMap);
    } else if (fields == "none") {
      fields = [];
    } else if (!Array.isArray(fields)) {
      fields = (fields || "").split(/\s*,\s*/);
    }
    return fields.map((key) => key.toLowerCase());
  } catch (error) {
    console.log(error);
    return typesMap ? Object.keys(typesMap) : [];
  }
};

export const setExclusions = ({
  excludeAncestral,
  excludeDescendant,
  excludeDirect,
  excludeMissing,
  excludeUnclassified,
}) => {
  let exclusions = {};
  if (excludeAncestral) {
    exclusions.ancestor = excludeAncestral;
  }
  if (excludeDescendant) {
    exclusions.descendant = excludeDescendant;
  }
  if (excludeDirect) {
    exclusions.direct = excludeDirect;
  }
  if (excludeMissing) {
    exclusions.missing = excludeMissing;
  }
  if (excludeUnclassified) {
    exclusions.unclassified = excludeUnclassified;
  }
  return exclusions;
};

const setSortBy = ({ sortBy, sortOrder, sortMode }) => {
  if (sortBy) {
    let sort = {};
    sort.by = sortBy;
    if (sortOrder) {
      sort.order = sortOrder;
    }
    if (sortMode) {
      sort.mode = sortMode;
    }
    sortBy = sort;
  }
  return sortBy;
};

const addCondition = (conditions, parts, type, summary = "value") => {
  if (!conditions) {
    conditions = {};
  }
  let segments = parts[0].split(/[\(\)]/);
  let stat = summary;
  if (segments.length > 1) {
    stat = segments[0];
    parts[0] = segments[1];
  }
  if (stat) {
    if (type == "date") {
      stat = stat == "min" ? "from" : stat == "max" ? "to" : stat;
    }
  }
  if (stat == "value") {
    stat = `${type}_value`;
  }
  if (!conditions[stat]) {
    conditions[stat] = {};
  }
  parts[0] = parts[0].toLowerCase();
  if (!conditions[stat][parts[0]]) {
    if (stat == "keyword_value") {
      conditions[stat][parts[0]] = [];
    } else {
      conditions[stat][parts[0]] = {};
    }
  }

  if (stat == "keyword_value") {
    if (parts[1].match(/[><]/)) {
      let values = {};
      operations(parts[1]).forEach((operator) => {
        values[operator] = parts[2];
      });
      conditions[stat][parts[0]].push(values);
    } else {
      if (parts[1] == "!=") {
        conditions[stat][parts[0]].push(
          parts[2]
            .split(",")
            .map((term) => `!${term}`)
            .join(",")
        );
      } else {
        conditions[stat][parts[0]].push(parts[2]);
      }
    }
  } else {
    if (parts[1] == "==") {
      parts[1] = "=";
    }
    if (parts[2].startsWith("!")) {
      parts[2] = parts[2].replace("!", "");
      parts[1] = `!${parts[1]}`;
    }
    operations(parts[1]).forEach((operator) => {
      conditions[stat][parts[0]][operator] = parts[2];
    });
  }

  return conditions;
};

const summaries = ["value", "count", "length", "max", "min", "range"];

const generateQuery = async ({
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
                typesMap[result][field].type, // TODO: catch missing type
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

export const getResults = async (params) => {
  let query = await generateQuery({ ...params });
  let index = indexName({ ...params });
  return query.func({ index, ...query.params });
};

const replaceSearchIds = async (params) => {
  let query = params.query;
  let index = indexName({ ...params });
  let match = query.match(/tax_\w+\(\s*([^\)]+\s*)/);
  if (match) {
    let ids = match.slice(1);
    if (ids.length > 0) {
      let altIds = await lookupAlternateIds({ recordId: ids, index });
      if (altIds.length == ids.length) {
        for (let i = 0; i < altIds.length; i++) {
          let altId = altIds[i].replace("taxon_id-", "");
          query = query.replace(`(${ids[i]})`, `(${altId})`);
        }
      }
    }
  }

  return query;
};

module.exports = {
  getSearchResults: async (req, res) => {
    let response = {};
    let exclusions = setExclusions(req.query);
    let sortBy = setSortBy(req.query);
    let queryId = req.query.queryId;
    if (queryId) {
      let countRes = await getResults({ ...req.query, exclusions, size: 0 });
      if (countRes.status && countRes.status.hits) {
        setProgress(queryId, { total: countRes.status.hits });
      }
    }
    response = await getResults({ ...req.query, exclusions, sortBy, req });
    if (response.status.hits == 0) {
      let query = await replaceSearchIds(req.query);
      if (query != req.query.query) {
        let countRes = await getResults({ ...req.query, exclusions, size: 0 });
        if (countRes.status && countRes.status.hits) {
          setProgress(queryId, { total: countRes.status.hits });
        }
        response = await getResults({
          ...req.query,
          query,
          exclusions,
          sortBy,
          req,
        });
        response.queryString = query;
      }
    }
    clearProgress(queryId);
    return res.format({
      json: () => {
        if (req.query.filename) {
          let filename = `${req.query.filename.replace(/\.json$/, "")}.json`;
          res.attachment(filename);
        }
        res.status(200).send(formatJson(response, req.query.indent));
      },
      csv: async () => {
        let opts = {
          delimiter: ",",
          fields: await parseFields({ ...req.query }),
          names: req.query.names ? req.query.names.split(/\s*,\s*/) : [],
          ranks: req.query.ranks ? req.query.ranks.split(/\s*,\s*/) : [],
          tidyData: req.query.tidyData,
          includeRawValues: req.query.includeRawValues,
          result: req.query.result,
        };
        let csv = await formatCsv(response, opts);
        if (req.query.filename) {
          let filename = `${req.query.filename.replace(/\.csv$/, "")}.csv`;
          res.attachment(filename);
        }
        res.status(200).send(csv);
      },

      tsv: async () => {
        let opts = {
          delimiter: "\t",
          fields: await parseFields({ ...req.query }),
          names: req.query.names ? req.query.names.split(/\s*,\s*/) : [],
          ranks: req.query.ranks ? req.query.ranks.split(/\s*,\s*/) : [],
          tidyData: req.query.tidyData,
          includeRawValues: req.query.includeRawValues,
          result: req.query.result,
          quote: "",
        };
        let tsv = await formatCsv(response, opts);
        if (req.query.filename) {
          let filename = `${req.query.filename.replace(/\.tsv$/, "")}.tsv`;
          res.attachment(filename);
        }
        res.status(200).send(tsv);
      },
    });
  },
};
