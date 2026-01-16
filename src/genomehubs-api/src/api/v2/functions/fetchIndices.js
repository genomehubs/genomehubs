import { checkResponse } from "./checkResponse.js";
import { client } from "./connection.js";
import { config } from "./config.js";
import { metadataCache } from "./metadataCache.js";

const CACHE_KEY = "indices";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const fetchIndicesFromElasticsearch = async (release = config.release) => {
  const { body } = await client.cat.indices({}, { meta: true }).catch((err) => {
    return err.meta;
  });
  let indices = [];
  if (body) {
    indices = body
      .split("\n")
      .map((row) => row.split(/\s+/))
      .filter(
        (row) =>
          row.length > 2 &&
          row[2].match(`--${config.taxonomy}--`) &&
          row[2].match(`--${release}`) &&
          row[6] > 0
      )
      .map((row) => row[2].split("--")[0]);
  }
  return indices;
};

export const fetchIndices = async (release = config.release) => {
  // Create cache key that includes release version
  const cacheKey = `${CACHE_KEY}:${release}`;

  // Use metadata cache with fallback to Elasticsearch
  return metadataCache.get(
    cacheKey,
    () => fetchIndicesFromElasticsearch(release),
    CACHE_TTL,
    true
  );
};
