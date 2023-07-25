export const setColors = ({
  colorPalette,
  palettes,
  levels,
  count,
  colors,
}) => {
  let palette;
  if (colorPalette) {
    if (palettes.byId[colorPalette]) {
      palette = palettes.byId[colorPalette];
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
      colors = levels[count];
    } else if (palette) {
      colors = palette.default;
    }
  }
  return { levels, colors };
};

export default setColors;
