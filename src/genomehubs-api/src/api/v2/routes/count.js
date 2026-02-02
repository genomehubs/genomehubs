import { formatJson } from "../functions/formatJson.js";
import { getResultCount } from "../functions/getResultCount.js";
import { logError } from "../functions/logger.js";

export const getSearchResultCount = async (req, res) => {
  try {
    let response = {};
    const q = req.expandedQuery || req.query || {};
    response = await getResultCount(q);
    return res.status(200).send(formatJson(response, q.indent));
  } catch (message) {
    logError({ req, message });
    return res.status(400).send({ status: "error" });
  }
};
