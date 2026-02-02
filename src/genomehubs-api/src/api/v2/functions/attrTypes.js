import { checkResponse } from "./checkResponse.js";
import { client } from "./connection.js";
import { config } from "./config.js";
import { indexName } from "./indexName.js";
import { metadataCache } from "./metadataCache.js";

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const setProcessedType = (meta) => {
  if (
    ["double", "float", "half_float", "scaled_float", "unsigned_long"].includes(
      meta.type
    ) ||
    (meta.type || "").endsWith("dp")
  ) {
    return "float";
  }
  if (["long", "integer", "short", "byte"].includes(meta.type)) {
    return "integer";
  }
  if (meta.type == "keyword") {
    if (meta.summary) {
      if (
        Array.isArray(meta.summary) &&
        (meta.summary[0] == "enum" ||
          (meta.summary[0] == "primary" && meta.summary[1] == "enum"))
      ) {
        return "ordered_keyword";
      }
      if (meta.summary == "enum") {
        return "ordered_keyword";
      }
    }

    return "keyword";
  }
  return meta.type;
};

const setProcessedSummary = (meta, typesMap) => {
  let summary;
  if (meta.default_summary) {
    summary = meta.default_summary;
  }
  let simple = "value";
  if (meta.return_type) {
    simple = meta.return_type;
  }
  if (!summary) {
    if (meta.type == "keyword") {
      summary = "keyword_value.raw";
    } else {
      summary = `${meta.type}_value`;
    }
  }
  typesMap[meta.group][meta.name].processed_summary = summary;
  typesMap[meta.group][meta.name].processed_simple = simple;
};

const fetchTypes = async ({ result, taxonomy, hub, release, indexType }) => {
  let index = indexName({
    result: indexType,
    taxonomy,
    hub,
    release,
  });
  let query = {
    match: {
      group: {
        query: result,
      },
    },
  };
  if (result == "multi") {
    query = {
      match_all: {},
    };
  }
  const { body } = await client
    .search(
      {
        index,
        body: {
          query,
          size: 10000,
        },
      },
      { meta: true }
    )
    .catch((err) => {
      return err.meta;
    });
  let status = checkResponse({ body });
  let typesMap = {};
  let synonyms = {};
  if (status.hits) {
    body.hits.hits.forEach((hit) => {
      if (!typesMap[hit._source.group]) {
        typesMap[hit._source.group] = {};
        synonyms[hit._source.group] = {};
      }
      typesMap[hit._source.group][hit._source.name] = hit._source;
      typesMap[hit._source.group][hit._source.name].processed_type =
        setProcessedType(hit._source);
      setProcessedSummary(hit._source, typesMap);
      if (hit._source.synonyms) {
        for (let synonym of hit._source.synonyms) {
          synonyms[hit._source.group][synonym] = hit._source.name;
        }
      } else if (hit._source.name.match("_")) {
        synonyms[hit._source.group][hit._source.name.replace(/_/g, "-")] =
          hit._source.name;
      }
    });
  }
  if (result != "multi") {
    return { typesMap: typesMap[result], synonyms: synonyms[result] || {} };
  }
  // Copy identifiers from taxon index if none in assembly index
  if (indexType == "identifiers" && !typesMap.assembly) {
    typesMap.assembly = typesMap.taxon;
  }
  return { typesMap, synonyms };
};

export const attrTypes = async ({
  name,
  result = "multi",
  indexType = "attributes",
  taxonomy = config.taxonomy,
}) => {
  // Create cache key from parameters
  const cacheKey = `attrTypes:${result}:${taxonomy}:${indexType}`;

  // Use metadata cache to fetch types
  const { typesMap = {}, synonyms = {} } = await metadataCache.get(
    cacheKey,
    () =>
      fetchTypes({
        result,
        taxonomy,
        hub: config.hub,
        release: config.release,
        indexType,
      }),
    CACHE_TTL,
    true
  );

  let lookupTypes = {};
  if (result == "multi") {
    Object.keys(typesMap).forEach((key) => {
      lookupTypes[key] = (name) => {
        if (!name) {
          return false;
        }
        if (synonyms[key][name]) {
          name = synonyms[key][name];
        }
        if (typesMap[key][name]) {
          return typesMap[key][name];
        }
        return false;
      };
    });
  } else {
    lookupTypes = (name) => {
      if (!name) {
        return false;
      }
      if (synonyms[name]) {
        name = synonyms[name];
      }
      if (typesMap[name]) {
        return typesMap[name];
      }
      return false;
    };
  }

  return { typesMap, lookupTypes };
};
