import convert from "color-convert";

const rowToHex = (row) => {
  return `#${row
    .map((v) =>
      Math.round(v * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
};

export const createD3Palette = (interpolateFunc, n) => {
  let start = 1;
  if (!n) {
    n = 100;
  }
  start = n;
  let levels = { default: [] };
  for (let iter = 1; iter <= n; iter++) {
    let palette = [];
    for (let i = 0; i < iter; i++) {
      palette.push(
        Array.isArray(interpolateFunc)
          ? interpolateFunc[i]
          : interpolateFunc(i / (iter > 4 ? iter - 1 : iter)),
      );
    }
    levels[iter] = palette.map((row) =>
      row.startsWith("rgb")
        ? `#${convert.rgb.hex(
            row.replace("rgb(", "").replace(")", "").split(","),
          )}`
        : row,
    );
    if (iter == n) {
      levels.default = palette;
    }
  }
  if (n < 100) {
    let j = 1;
    for (let i = n + 1; i <= 100; i++) {
      levels[i] = levels[i - 1].concat([levels[i - 1][j - 1]]);
      j++;
    }
  }
  return levels;
};

export const createPalette = (raw, n) => {
  let levels = { default: [] };

  if (!n) {
    levels.default = raw.map((row) => {
      if (Array.isArray(row)) {
        return rowToHex(row);
      }
      return row.startsWith("rgb")
        ? `#${convert.rgb.hex(
            row.replace("rgb(", "").replace(")", "").split(","),
          )}`
        : row;
    });
    n = raw.length;
    for (let iter = 1; iter <= n; iter++) {
      levels[iter] = levels.default.slice(0, iter);
    }
  } else {
    for (let iter = 1; iter <= n; iter++) {
      let originalCount = raw.length;
      let sampleFrequency = originalCount / iter;
      let palette = [];
      let lastRemainder = Number.POSITIVE_INFINITY;
      raw.forEach((row, i) => {
        if (Number.isInteger(sampleFrequency)) {
          if (i % sampleFrequency == 0) {
            palette.push(rowToHex(row));
          }
        } else {
          let remainder = i % sampleFrequency;
          if (remainder < lastRemainder) {
            palette.push(rowToHex(row));
          }

          lastRemainder = remainder;
        }
      });
      levels[iter] = palette;
      if (iter == n) {
        levels.default = palette;
      }
    }
  }
  if (n < 100) {
    let j = 1;
    for (let i = n + 1; i <= 100; i++) {
      levels[i] = levels[i - 1].concat([levels[i - 1][j - 1]]);
      j++;
    }
  }
  return levels;
};

export default createPalette;
