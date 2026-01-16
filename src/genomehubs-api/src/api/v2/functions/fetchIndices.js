import { config } from "./config.js";
import { getIndices } from "./unifiedMetadataFetch.js";

/**
 * Fetch indices - now uses unified metadata fetch with msearch batching
 */
export const fetchIndices = async (release = config.release) => {
  return getIndices(release);
};
