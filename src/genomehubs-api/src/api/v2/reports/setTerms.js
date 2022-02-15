import { getCatLabels } from "./getCatLabels";

export const setTerms = async ({ cat, typesMap, taxonomy, apiParams }) => {
  let size = 5;
  let other;
  if (!cat) {
    return { cat, size, other };
  }
  if (cat && cat.endsWith("+")) {
    cat = cat.replace(/\+$/, "");
    other = true;
  }
  let portions = cat.split(/\s*[\[\]]\s*/);
  if (portions.length > 1) {
    size = portions[1];
    delete portions[1];
    cat = portions.join("");
    other = other || false;
  }
  if (!cat.match(/\s*[=,]\s*/)) {
    if (other === false) {
      other = undefined;
    } else {
      other = true;
    }
    return { cat, size, other };
  }
  let parts = cat.split(",");
  let field;
  let terms = [];
  let by;
  parts.forEach((part) => {
    let bits = part.split("=");
    let value;
    if (bits.length == 2) {
      field = bits[0];
      value = bits[1];
    } else {
      value = bits[0];
    }
    terms.push({ key: value });
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
