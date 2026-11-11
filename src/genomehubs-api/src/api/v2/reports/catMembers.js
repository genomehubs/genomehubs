// Values behind a category; more than one when aliased terms were merged
export const memberValues = (obj) => obj.values || [obj.key];

// Each member value takes one slot
export const slotCount = (terms = []) =>
  terms.reduce((count, obj) => count + memberValues(obj).length, 0);

// Leading terms that start within size slots; a merged group is kept whole
export const termsWithinSize = (terms = [], size) => {
  let used = 0;
  const overflow = terms.findIndex((obj) => {
    const start = used;
    used += memberValues(obj).length;
    return start >= size;
  });
  return overflow < 0 ? terms : terms.slice(0, overflow);
};

// Maps each lowercased member of a merged category to its category key
export const memberKeyLookup = (cats = []) => {
  const lookup = new Map();
  for (const obj of cats.filter((cat) => cat.values)) {
    for (const value of obj.values) {
      lookup.set(value.toLowerCase(), obj.key);
    }
  }
  return lookup;
};
