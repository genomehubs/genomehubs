import { checkResponse } from "./checkResponse";
import { client } from "./connection";
import { config } from "./config.js";
import { indexName } from "./indexName";

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
    .search({
      index,
      body: {
        query,
        size: 1000,
      },
    })
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
  return { typesMap, synonyms };
};

export const attrTypes = async ({
  name,
  result = "multi",
  indexType = "attributes",
  taxonomy = config.taxonomy,
}) => {
  const { typesMap = {}, synonyms = {} } = await fetchTypes({
    result,
    taxonomy,
    hub: config.hub,
    release: config.release,
    indexType,
  });
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
