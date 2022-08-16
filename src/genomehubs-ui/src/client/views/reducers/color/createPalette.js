const rowToRGB = (row) => {
  return `rgb(${row.map((v) => Math.round(v * 255))})`;
};

export const createD3Palette = (interpolateFunc, n) => {
  let start = 1;
  if (!n) {
    n = 100;
    start = n;
  }
  let levels = { default: [] };
  for (let iter = 1; iter <= n; iter++) {
    let palette = [];
    for (let i = 0; i < iter; i++) {
      palette.push(interpolateFunc(i / iter));
    }
    levels[iter] = palette;
    if (iter == n) {
      levels.default = palette;
    }
  }
  return levels;
};

export const createPalette = (raw, n) => {
  if (!n) {
    return { default: raw.map((row) => rowToRGB(row)) };
  }
  let levels = { default: [] };
  for (let iter = 1; iter <= n; iter++) {
    let originalCount = raw.length;
    let sampleFrequency = originalCount / iter;
    // console.log({ originalCount, sampleFrequency });
    let palette = [];
    let lastRemainder = Number.POSITIVE_INFINITY;
    raw.forEach((row, i) => {
      if (Number.isInteger(sampleFrequency)) {
        if (i % sampleFrequency == 0) {
          palette.push(rowToRGB(row));
        }
      } else {
        let remainder = i % sampleFrequency;
        if (remainder < lastRemainder) {
          palette.push(rowToRGB(row));
        }

        lastRemainder = remainder;
        //   console.log(row);
        //   if (i <= row) lastRow = row;
      }
    });
    levels[iter] = palette;
    if (iter == n) {
      levels.default = palette;
    }
  }
  console.log(levels);
  return levels;
};

export default createPalette;
