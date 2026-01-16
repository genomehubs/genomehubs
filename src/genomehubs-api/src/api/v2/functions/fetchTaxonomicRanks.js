import { client } from "./connection.js";
import { indexName } from "./indexName.js";
import { logError } from "./logger.js";
import { metadataCache } from "./metadataCache.js";

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const fetchTaxonomicRanksFromElasticsearch = async ({ req }) => {
  try {
    const index = indexName({
      result: req.query.result,
      taxonomy: req.query.taxonomy,
      release: req.query.release,
    });

    const esResult = await client.search({
      index,
      body: {
        size: 0,
        query: {
          bool: {
            must_not: {
              term: { taxon_rank: "no rank" },
            },
          },
        },
        aggs: {
          unique_ranks: {
            terms: {
              field: "taxon_rank",
              size: 100,
            },
          },
        },
      },
    });
    const aggregations = esResult?.body?.aggregations || esResult?.aggregations;
    const ranks = aggregations?.unique_ranks?.buckets.map(
      (bucket) => bucket.key
    );
    return {
      success: true,
      error: null,
      ranks,
    };
  } catch (error) {
    logError({
      req,
      message: error.message,
    });

    return {
      success: false,
      error: error.message || "Failed to fetch taxonomic ranks",
      ranks: [],
    };
  }
};

export const fetchTaxonomicRanks = async ({ req }) => {
  // Create cache key from query parameters
  const cacheKey = `taxonomicRanks:${req.query.result}:${req.query.taxonomy}:${req.query.release}`;

  // Use metadata cache with fallback to Elasticsearch
  return metadataCache.get(
    cacheKey,
    () => fetchTaxonomicRanksFromElasticsearch({ req }),
    CACHE_TTL,
    true
  );
};
