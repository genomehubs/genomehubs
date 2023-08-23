import { attrTypes } from "./attrTypes";
import { logError } from "./logger";
import { summaries } from "./summaries";

export const parseFields = async ({ result, fields, taxonomy }) => {
  let { typesMap, lookupTypes } = await attrTypes({ result, taxonomy });
  try {
    if (!typesMap) {
      return [];
    }
    if (!fields || fields == "undefined") {
      fields = Object.keys(typesMap)
        .map((key) => key.toLowerCase())
        .filter((key) => typesMap[key] && typesMap[key].display_level == 1);
    } else if (!fields || fields == "all") {
      fields = Object.keys(typesMap);
    } else if (fields == "none") {
      fields = [];
    } else if (!Array.isArray(fields)) {
      fields = (fields || "").split(/\s*,\s*/);
    }
    let fieldList = new Set();
    for (let field of fields) {
      let [summary, attr] = field.split(/[\(\)]/);
      if (attr && summaries.includes(summary)) {
        field = attr;
      }
      let fieldArr = [];
      if (field.match(/\*/)) {
        let parts = field.split(/\*/);
        let starts = parts[0] > "" && parts[0];
        let ends = parts[1] > "" && parts[1];
        for (let fieldName of Object.keys(typesMap)) {
          if (starts && !fieldName.startsWith(starts)) {
            continue;
          }
          if (ends && !fieldName.endsWith(ends)) {
            continue;
          }
          fieldArr.push(fieldName);
        }
        fieldArr;
      } else {
        fieldArr = [field];
      }
      for (let fld of fieldArr) {
        let meta = lookupTypes(fld);
        if (meta) {
          fieldList.add(meta.name);
        } else {
          fieldList.add(fld);
        }
        let [f, subset] = fld.split(":");
        if (subset) {
          let m = lookupTypes(f);
          if (m) {
            fieldList.add(m.name);
          } else {
            fieldList.add(f);
          }
        }
      }
    }
    fields = [...new Set(fieldList)];
    return fields;
    // return fields.map((key) => key.toLowerCase());
  } catch (message) {
    logError({ req: {}, message });
    return typesMap ? Object.keys(typesMap) : [];
  }
};
