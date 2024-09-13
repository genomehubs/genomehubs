export const fillValues = (str, obj = {}) => {
  try {
    return str
      .split(/\{(.+?)\}/)
      .map((part, i) => {
        if (!part) {
          return "";
        }
        if (i % 2 == 1) {
          let value = obj;
          let lower = part.startsWith("lc_");
          for (let k of part.slice(lower ? 3 : 0).split(".")) {
            value = value[k];
            if (typeof value === "undefined") {
              throw `ERROR fetching ${part}`;
            }
          }
          if (Number.isNaN(value)) {
            return lower ? value.toLowerCase() : value;
          } else {
            return value.toLocaleString();
          }
        }
        return part;
      })
      .join("");
  } catch {
    return "";
  }
};

export default fillValues;
