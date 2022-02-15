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
  let types = {};
  if (status.hits) {
    body.hits.hits.forEach((hit) => {
      if (!types[hit._source.group]) {
        types[hit._source.group] = {};
      }
      types[hit._source.group][hit._source.name] = hit._source;
    });
  }
  if (result != "multi") {
    return types[result];
  }
  return types;
};

export const attrTypes = async ({
  result = "multi",
  indexType = "attributes",
  taxonomy = config.taxonomy,
}) =>
  await fetchTypes({
    result,
    taxonomy,
    hub: config.hub,
    release: config.release,
    indexType,
  });
