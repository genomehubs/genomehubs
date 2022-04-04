export const setScale = ({ field, typesMap, opts }) => {
  if (opts) {
    let parts = opts.split(/\s*;\s*/);
    if (parts.length == 1) {
      parts = opts.split(/\s*,\s*/);
    }
    if (parts[3]) {
      return parts[3].toLowerCase();
    }
  }
  if (typesMap[field] && typesMap[field].bins && typesMap[field].bins.scale) {
    return typesMap[field].bins.scale.toLowerCase();
  }
  if (typesMap[field] && typesMap[field].type == "keyword") {
    return "ordinal";
  }
  return "linear";
};
