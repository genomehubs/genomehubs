import { client } from "./connection.js";
import { indexName } from "./indexName.js";
import { logError } from "./logger.js";

export const fetchTaxonomicRanks = async ({ req }) => {
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

    const ranks = esResult?.body?.aggregations?.unique_ranks?.buckets.map(
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
