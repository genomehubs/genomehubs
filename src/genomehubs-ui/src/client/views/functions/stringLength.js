import charWidth from "./charWidth";

export const stringLength = (str, options) => {
  let length = `${Number.isNaN(str) ? (str ? str : "") : str}`
    .split("")
    .reduce((a, b) => a + charWidth(b, options), 0);
  return length;
};

export const maxStringLength = (arr, format = (v) => v, scale) => {
  return (
    arr
      .map((value) => stringLength(format(value)))
      .reduce((a, b) => Math.max(a, b), 0) * scale
  );
};

export default stringLength;
