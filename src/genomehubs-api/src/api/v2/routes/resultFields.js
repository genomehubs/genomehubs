import { attrTypes } from "../functions/attrTypes";
import { config } from "../functions/config";
import { formatJson } from "../functions/formatJson";
import { logError } from "../functions/logger";

export const getResultFields = async (req, res) => {
  let fields = {};
  let lookupFields;
  let identifiers = {};
  let lookupIdentifiers;
  let status = {};
  let release = req.query.release || config.release;
  let hub = config.hub;
  let source = config.source;
  try {
    ({ typesMap: fields } = await attrTypes({
      ...req.query,
    }));
    ({ typesMap: identifiers } = await attrTypes({
      ...req.query,
      indexType: "identifiers",
    }));
    status = { success: true };
  } catch (message) {
    logError({ req, message });
    status = { success: false, error: "Unable to fetch fields" };
  }
  let response = { status, fields, identifiers, hub, release, source };
  return res.status(200).send(formatJson(response, req.query.indent));
};
