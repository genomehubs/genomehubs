import { client } from "./connection.js";

export const fetchTaxonomicRanks = async () => {
  try {
    const result = await client.search({
      index: "taxonomy--ncbi--goat--2021.10.15",
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

    const ranks = result.body.aggregations.unique_ranks.buckets.map(
      (bucket) => bucket.key
    );

    return ranks;
  } catch (error) {
    console.error("Error fetching taxonomic ranks:", error);
    throw new Error("Failed to fetch taxonomic ranks");
  }
};
