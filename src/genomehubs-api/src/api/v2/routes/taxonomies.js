import { fetchTaxonomies } from "../functions/fetchTaxonomies";
import { formatJson } from "../functions/formatJson";
export const getTaxonomies = async (req, res) => {
  let response = await fetchTaxonomies(req.query.release);
  return res.status(200).send(formatJson(response, req.query.indent));
};
