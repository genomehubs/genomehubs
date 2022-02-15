import { formatJson } from "../functions/formatJson";
import { getProgress } from "../functions/progress";

module.exports = {
  getProgress: async (req, res) => {
    let queryId = req.query.queryId;
    let progress = getProgress(queryId);
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
  },
};
