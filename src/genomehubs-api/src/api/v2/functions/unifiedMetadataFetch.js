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
  const RETRIES = parseInt(process.env.METADATA_FETCH_RETRIES || "3", 10);
  const RETRY_DELAY_MS = parseInt(
    process.env.METADATA_FETCH_RETRY_MS || "2000",
    10,
  );

  const resType = result;

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  const fetchWithRetry = async () => {
    let lastErr = null;
    for (let attempt = 1; attempt <= RETRIES; attempt++) {
      try {
        const metadata = await batchFetchMetadataOnMiss({
          release,
          result: resType,
          taxonomy,
        });

        // If we get a sensible metadata object, return it.
        if (
          metadata &&
          (Object.keys(metadata).length > 0 ||
            metadata.taxonomies ||
            metadata.indices ||
            metadata.attrTypes)
        ) {
          return metadata;
        }

        // Treat empty result as an error so we retry
        lastErr = new Error("Empty metadata result");
      } catch (err) {
        lastErr = err;
      }

      if (attempt < RETRIES) {
        await sleep(RETRY_DELAY_MS);
      }
    }

    throw lastErr || new Error("Failed to fetch metadata after retries");
  };

  return metadataCache.get(cacheKey, fetchWithRetry, CACHE_TTL, true);
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
