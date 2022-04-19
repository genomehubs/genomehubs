import { fetchTaxonomies } from "../functions/fetchTaxonomies";
import { formatJson } from "../functions/formatJson";
import { logError } from "../functions/logger";

export const getTaxonomies = async (req, res) => {
  let response = [];
  try {
    response = await fetchTaxonomies(req.query.release);
  } catch (message) {
    logError({ req, message });
  }
  return res.status(200).send(formatJson(response, req.query.indent));
};
