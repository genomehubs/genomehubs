import { getCatLabels } from "./getCatLabels.js";

// Terms sharing an alias merge into one category, keyed by its first value
const groupByAlias = (entries) => {
  const terms = [];
  const translations = {};
  const groups = new Map();
  for (const { val, translation, label } of entries) {
    if (translation && groups.has(translation)) {
      const group = groups.get(translation);
      group.values = group.values || [group.key];
      group.values.push(val);
      continue;
    }
    const term = { key: val, ...(label && { label }) };
    terms.push(term);
    translations[val] = translation || val;
    if (translation) {
      groups.set(translation, term);
    }
  }
  return { terms, translations };
};

export const setTerms = async ({
  cat,
  opts,
  lookupTypes,
  taxonomy,
  apiParams,
}) => {
  let size = 5;
  let other;
  let otherLabel;
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
      // Accept "N+" or "N+Label" (label renames the 'other' bucket)
      const otherMatch = size.match(/^([^+]*)\+(.*)$/);
      if (otherMatch) {
        size = otherMatch[1];
        other = true;
        otherLabel = otherMatch[2].trim() || undefined;
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
  let entries = [];
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
      entries.push({ val, translation });
    }
  });
  let terms = [];
  let translations = {};
  if (lookupTypes(field)) {
    by = "attribute";
    ({ terms, translations } = groupByAlias(entries));
  } else {
    by = "lineage";
    // lookup taxon_id if not attribute
    let cats = await getCatLabels({
      cat: field,
      cats: entries.map(({ val }) => ({ key: val })),
      taxonomy,
      apiParams,
      key: "taxon_id",
    });
    // members are keyed by taxon_id; labels are the alias or scientific name
    ({ terms, translations } = groupByAlias(
      cats.map((obj, i) => ({
        val: obj.label,
        translation: entries[i].translation,
        label: entries[i].translation || obj.key,
      })),
    ));
  }
  return {
    cat: field,
    terms,
    translations,
    by,
    size,
    min,
    max,
    scale,
    other,
    otherLabel,
  };
};
