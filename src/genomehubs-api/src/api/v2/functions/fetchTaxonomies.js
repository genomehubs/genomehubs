import { config } from "./config.js";
import { getTaxonomies } from "./unifiedMetadataFetch.js";

/**
 * Fetch taxonomies - now uses unified metadata fetch with msearch batching
 */
export const fetchTaxonomies = async (release = config.release) => {
  return getTaxonomies(release);
};
