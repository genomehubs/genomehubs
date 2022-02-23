import { formatJson } from "../functions/formatJson";
import { getProgress as getQueryProgress } from "../functions/progress";

export const getProgress = async (req, res) => {
  let queryId = req.query.queryId;
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
};
