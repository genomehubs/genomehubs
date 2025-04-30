import { formatJson } from "../functions/formatJson.js";
import { logError } from "../functions/logger.js";
import { fetchTaxonomicRanks } from "../functions/fetchTaxonomicRanks.js";

export const getTaxonomicRanks = async (req, res) => {
  try {
    let response = [];
    const taxonomicRanks = await fetchTaxonomicRanks();
    return res.status(200).send(formatJson(taxonomicRanks, req.query.indent));
  } catch (error) {
    logError({
      req,
      message: error.message || "Failed to fetch taxonomic ranks",
    });
  }
};
