export const setScale = ({ field, lookupTypes, opts }) => {
  if (opts) {
    let parts = opts.split(/\s*;\s*/);
    if (parts.length == 1) {
      parts = opts.split(/\s*,\s*/);
    }
    if (parts[3]) {
      return parts[3].toLowerCase();
    }
  }
  let meta = lookupTypes(field);
  if (meta && meta.bins && meta.bins.scale) {
    return meta.bins.scale.toLowerCase();
  }
  if (meta && meta.type && !meta.return_type && meta.type == "keyword") {
    return "ordinal";
  }
  return "linear";
};
