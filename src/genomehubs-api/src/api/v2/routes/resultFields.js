import { attrTypes } from "../functions/attrTypes";
import { config } from "../functions/config";
import { formatJson } from "../functions/formatJson";

module.exports = {
  getResultFields: async (req, res) => {
    let fields = {};
    let identifiers = {};
    let status = {};
    let release = req.query.release || config.release;
    let hub = config.hub;
    let source = config.source;
    try {
      fields = await attrTypes({ ...req.query });
      identifiers = await attrTypes({ ...req.query, indexType: "identifiers" });
      status = { success: true };
    } catch {
      status = { success: false, error: "Unable to fetch fields" };
    }
    let response = { status, fields, identifiers, hub, release, source };
    return res.status(200).send(formatJson(response, req.query.indent));
  },
};
