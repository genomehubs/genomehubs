import { formatJson } from "../functions/formatJson.js";
import { getProgress as getQueryProgress } from "../functions/progress.js";
import { logError } from "../functions/logger.js";

export const getProgress = async (req, res) => {
  try {
    let { queryId } = req.query;
    let progress = getQueryProgress(queryId);
    let response;
    if (queryId) {
      response = {
        status: { success: true },
        queryId,
        progress,
      };
    } else {
      response = {
        status: { success: false },
      };
    }
    //response = await getRecordsById(req.query);
    return res.status(200).send(formatJson(response, req.query.indent));
  } catch (message) {
    logError({ req, message });
    return res.status(400).send({ status: "error" });
  }
};
