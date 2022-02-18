import { checkDocResponse } from "../functions/checkDocResponse";
import { client } from "../functions/connection";
import { formatJson } from "../functions/formatJson";
import { getResultCount } from "../functions/getResultCount";

export const getSearchResultCount = async (req, res) => {
  let response = {};
  response = await getResultCount(req.query);
  return res.status(200).send(formatJson(response, req.query.indent));
};
