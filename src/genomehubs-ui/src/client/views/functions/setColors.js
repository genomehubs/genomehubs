import convert from "color-convert";

export const setColors = ({
  colorPalette,
  palettes,
  levels,
  count,
  colors,
  offset,
  reverse,
}) => {
  let palette;

  levels = structuredClone(levels);

  if (colorPalette) {
    let [paletteName, paletteLevels] = colorPalette.split(":");
    count = paletteLevels || count;
    if (palettes.byId[paletteName]) {
      palette = palettes.byId[paletteName];
      levels = palette.levels || [];
    } else if (
      colorPalette.match(/[0-9a-f]{6}/i) &&
      colorPalette.match(/^[0-9a-f,]+$/i)
    ) {
      palette = { default: colorPalette.split(",").map((h) => `#${h}`) };
      levels = [];
    }
  }
  if (count) {
    if (levels[count]) {
      colors = [...levels[count]];
    } else if (palette) {
      if (palette[count]) {
        colors = [...palette[count]];
      } else {
        colors = [...palette.default];
      }
    }
  } else {
    colors = [...colors];
  }

  for (let [key, arr] of Object.entries(levels)) {
    if (!isNaN(key)) {
      if (reverse) {
        levels[key] = arr.slice().reverse();
      }
      if (offset) {
        let modOffset = offset % arr.length;
        levels[key] = [...arr.slice(modOffset).concat(arr.slice(0, modOffset))];
      }
    }
  }
  if (offset) {
    let arr = levels[colors.length + offset];
    colors = [...arr.slice(0, colors.length)];
  }
  if (reverse) {
    colors = colors.slice().reverse();
  }

  return {
    levels,
    colors: colors.map((c) => {
      if (c.match("rgb")) {
        return `#${convert.rgb.hex(c.split("(")[1].split(")")[0])}`;
      }
      return c;
    }),
  };
};

export default setColors;
