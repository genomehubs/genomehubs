import { getCatLabels } from "./getCatLabels.js";

export const setTerms = async ({
  cat,
  opts,
  lookupTypes,
  taxonomy,
  apiParams,
}) => {
  let size = 5;
  let other;
  let field;
  if (!cat) {
    return { cat, size, other };
  }
  let min, max, scale;
  opts = opts.replace(/^nsort/, "");
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
    let portions = cat.split(/\s*[\[\]]\s*/);
    if (portions.length > 1) {
      // TODO: get min, max and scale opts here
      size = portions[1];
      delete portions[1];
      cat = portions.join("");
    }
    if (!cat.match(/\s*[=,]\s*/)) {
      field = cat;
      // return { cat, size, other };
    }
  }
  if (field && field.match(/\+/)) {
    field = field.replace(/\+/, "");
    other = true;
  }
  let parts = cat.split(",");
  let terms = [];
  let translations = {};
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
      let [val, translation] = value.split(/@/);
      terms.push({ key: val });
      translations[val] = translation || val;
    }
  });
  if (lookupTypes(field)) {
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
  return { cat: field, terms, translations, by, size, min, max, scale, other };
};
