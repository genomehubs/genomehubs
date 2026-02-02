import { fetchTaxonomicRanks } from "../functions/fetchTaxonomicRanks.js";
import { formatJson } from "../functions/formatJson.js";

export const getTaxonomicRanks = async (req, res) => {
  let status = {};
  let ranks = [];
  let took = 0;

  const start = Date.now();
  status = { success: true };

  const taxonomicRanksResponse = await fetchTaxonomicRanks({ req });

  if (!taxonomicRanksResponse.success) {
    status = {
      success: false,
      error: taxonomicRanksResponse.error || "Internal Server error",
    };
    ranks = [];
  } else {
    ranks = taxonomicRanksResponse.ranks || [];
  }

  took = Date.now() - start;

  const response = { status, ranks, took };
  const q = req.expandedQuery || req.query || {};
  return res
    .status(status.success ? 200 : 500)
    .send(formatJson(response, q.indent));
};
