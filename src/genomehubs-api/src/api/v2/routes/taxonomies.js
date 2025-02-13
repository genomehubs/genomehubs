import { aggregateRawValueSources } from "../queries/aggregateRawValueSources.js";
import { fetchTaxonomies } from "../functions/fetchTaxonomies.js";
import { formatJson } from "../functions/formatJson.js";
import { logError } from "../functions/logger.js";

export const getTaxonomies = async (req, res) => {
  let response = [];
  try {
    response = await fetchTaxonomies(req.query.release);
  } catch (message) {
    logError({ req, message });
  }
  return res.status(200).send(formatJson(response, req.query.indent));
};
