import { getCatLabels } from "./getCatLabels";

export const setTerms = async ({
  cat,
  opts,
  typesMap,
  taxonomy,
  apiParams,
}) => {
  let size = 5;
  let other;
  let field;
  if (!cat) {
    return { cat, size, other };
  }
  if (opts) {
    let options = opts.split(/\s*;\s*/);
    if (options.length == 1) {
      options = opts.split(/\s*,\s*/);
    }
    if (options[2]) {
      size = options[2];
      if (size.endsWith("+")) {
        size = size.replace(/\+$/, "");
        other = true;
      }
    }
    if (options[0]) {
      cat = `${cat}=${options[0]}`;
    } else {
      field = cat;
    }
  } else {
    if (cat && cat.match(/\+/)) {
      cat = cat.replace(/\+/, "");
      other = true;
    }
    let portions = cat.split(/\s*[\[\]]\s*/);
    if (portions.length > 1) {
      size = portions[1];
      delete portions[1];
      cat = portions.join("");
    }
    if (!cat.match(/\s*[=,]\s*/)) {
      field = cat;
      // return { cat, size, other };
    }
  }

  let parts = cat.split(",");
  let terms = [];
  let by;
  parts.forEach((part, i) => {
    let bits = part.split("=");
    let value;
    if (bits.length == 2) {
      field = bits[0];
      value = bits[1];
    } else if (i > 0) {
      value = bits[0];
    }
    if (value) {
      terms.push({ key: value });
    }
  });
  if (typesMap[field]) {
    by = "attribute";
  } else {
    by = "lineage";
    // lookup taxon_id if not attribute
    let cats = await getCatLabels({
      cat: field,
      cats: terms,
      taxonomy,
      apiParams,
      key: "taxon_id",
    });
    // invert key and label
    terms = [];
    cats.forEach((obj) => {
      terms.push({ key: obj.label, label: obj.key });
    });
  }
  return { cat: field, terms, by, size, other };
};
