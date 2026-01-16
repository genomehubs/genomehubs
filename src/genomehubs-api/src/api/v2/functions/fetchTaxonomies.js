import { client } from "./connection.js";
import { config } from "./config.js";
import { metadataCache } from "./metadataCache.js";

const CACHE_KEY = "taxonomies";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const fetchTaxonomiesFromElasticsearch = async (release = config.release) => {
  if (!client) {
    return ["broken"];
  }
  const { body } = await client.cat.indices({}, { meta: true }).catch((err) => {
    return err.meta;
  });
  let taxonomies = body
    .split("\n")
    .map((row) => row.split(/\s+/))
    .filter(
      (row) =>
        row.length > 2 && row[2].match("taxon--") && row[2].match(release)
    )
    .map((row) => row[2].split("--")[1]);
  return [
    config.taxonomy,
    ...taxonomies.filter((taxonomy) => taxonomy != config.taxonomy),
  ];
};

export const fetchTaxonomies = async (release = config.release) => {
  // Create cache key that includes release version
  const cacheKey = `${CACHE_KEY}:${release}`;

  // Use metadata cache with fallback to Elasticsearch
  return metadataCache.get(
    cacheKey,
    () => fetchTaxonomiesFromElasticsearch(release),
    CACHE_TTL,
    true
  );
};
