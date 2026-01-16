import { batchFetchMetadataOnMiss } from "./batchMetadataFetch.js";
import { config } from "./config.js";
import { metadataCache } from "./metadataCache.js";

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Unified metadata fetch that uses msearch batching to reduce ES requests.
 * When metadata cache misses, this fetches taxonomies, indices, attrTypes,
 * and taxonomicRanks in a single msearch call (2 cat calls + 1 msearch = 3 total requests)
 * vs the previous 4 separate requests.
 */
export const getAllMetadata = async ({
  release = config.release,
  result = "taxon",
  taxonomy = config.taxonomy,
} = {}) => {
  const cacheKey = `metadata:all:${release}:${result}:${taxonomy}`;

  return metadataCache.get(
    cacheKey,
    async () => {
      return batchFetchMetadataOnMiss({
        release,
        result,
        taxonomy,
      });
    },
    CACHE_TTL,
    true
  );
};

/**
 * Get just taxonomies from the batch metadata fetch
 */
export const getTaxonomies = async (release = config.release) => {
  const metadata = await getAllMetadata({ release });
  return metadata.taxonomies;
};

/**
 * Get just indices from the batch metadata fetch
 */
export const getIndices = async (release = config.release) => {
  const metadata = await getAllMetadata({ release });
  return metadata.indices;
};

/**
 * Get just attr types from the batch metadata fetch
 */
export const getAttrTypes = async ({
  result = "taxon",
  taxonomy = config.taxonomy,
  release = config.release,
} = {}) => {
  const metadata = await getAllMetadata({
    release,
    result,
    taxonomy,
  });
  return metadata.attrTypes;
};

/**
 * Get just taxonomic ranks from the batch metadata fetch
 */
export const getTaxonomicRanks = async ({
  result = "taxon",
  taxonomy = config.taxonomy,
  release = config.release,
} = {}) => {
  const metadata = await getAllMetadata({
    release,
    result,
    taxonomy,
  });
  return metadata.taxonomicRanks;
};
