import { client } from "./connection.js";
import { config } from "./config.js";
import { indexName } from "./indexName.js";

export const fetchTaxonomicRanks = async ({ result: resultParam, release }) => {
  try {
    const index = indexName({
      result: resultParam,
      taxonomy: config.taxonomy,
      hub: config.hub,
      release: release,
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

    const ranks = esResult.body.aggregations.unique_ranks.buckets.map(
      (bucket) => bucket.key
    );

    return ranks;
  } catch (error) {
    console.error("Error fetching taxonomic ranks:", error);
    throw new Error("Failed to fetch taxonomic ranks");
  }
};
