import { config } from "./config.js";
import { getTaxonomicRanks } from "./unifiedMetadataFetch.js";

/**
 * Fetch taxonomic ranks - now uses unified metadata fetch with msearch batching
 */
export const fetchTaxonomicRanks = async ({ req }) => {
  try {
    const ranks = await getTaxonomicRanks({
      result: req.query.result,
      taxonomy: req.query.taxonomy,
      release: req.query.release || config.release,
    });

    return {
      success: true,
      error: null,
      ranks,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch taxonomic ranks",
      ranks: [],
    };
  }
};
