export const facetLayouts = ["single", "row", "column", "grid"];

export const getFacetKeys = (pointData) => {
  let keys = new Set();
  for (let points of pointData || []) {
    for (let point of points || []) {
      if (point.facet !== undefined && point.facet !== null) {
        keys.add(String(point.facet));
      }
    }
  }
  return [...keys].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
};

// Returns null for single (or unknown) layouts, meaning one panel with all points.
export const getFacetGrid = (layout, count) => {
  if (count < 1) {
    return null;
  }
  if (layout == "row") {
    return { cols: 1, rows: count };
  }
  if (layout == "column") {
    return { cols: count, rows: 1 };
  }
  if (layout == "grid") {
    let cols = Math.ceil(Math.sqrt(count));
    return { cols, rows: Math.ceil(count / cols) };
  }
  return null;
};
