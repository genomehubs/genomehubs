import { fetchIndices } from "../functions/fetchIndices";
import { formatJson } from "../functions/formatJson";
import { logError } from "../functions/logger";

export const getIndices = async (req, res) => {
  let response = [];
  try {
    response = await fetchIndices(req.query.release);
  } catch (message) {
    logError({ req, message });
  }
  return res.status(200).send(formatJson(response, req.query.indent));
};
