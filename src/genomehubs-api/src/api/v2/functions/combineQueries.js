export const combineQueries = (x = "", y = "") => {
  if (y.match(/tax_(:?tree|eq|name|depth|rank)\(/)) {
    let xParts = x.split(/\s+and\s+/i);
    let yParts = y.split(/\s+and\s+/i);
    for (let yTerm of yParts) {
      let [type, val] = yTerm.split(/\s*[\(\)]\s*/);
      if (type.startsWith()) {
        xParts = xParts.filter((term) => !term.match(type + /\(/));
      }
    }
    x = xParts.join(" AND ");
  }
  if (y) {
    return x > "" ? `${y} AND ${x}` : y;
  }
  return x;
};
