import { formatJson } from "../functions/formatJson";
import { getRecordsById } from "../functions/getRecordsById";

export const getRecords = async (req, res) => {
  let response = {};
  response = await getRecordsById(req.query);
  return res.status(200).send(formatJson(response, req.query.indent));
};
