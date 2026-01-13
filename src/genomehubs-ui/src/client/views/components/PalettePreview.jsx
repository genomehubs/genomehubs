import Tooltip from "./Tooltip";

const multiply = (size, factor, divisor) => {
  let unit = size.match(/\D+$/)[0];
  let num = parseFloat(size);
  if (divisor) {
    num /= divisor;
  }
  return `${num * factor}${unit}`;
};

const checkContrast = (color, background, threshold = 4.5) => {
  const hexToRgb = (hex) => {
    let bigint = parseInt(hex.slice(1), 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return [r, g, b];
  };

  let fg = hexToRgb(color);
  let bg = hexToRgb(background);
  let fgLum = 0.2126 * fg[0] + 0.7152 * fg[1] + 0.0722 * fg[2];
  let bgLum = 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2];
  let contrast =
    fgLum > bgLum
      ? (fgLum + 0.05) / (bgLum + 0.05)
      : (bgLum + 0.05) / (fgLum + 0.05);
  return contrast >= threshold;
};

const getContrastColor = (color) => {
  // contrast color will either be "#31323f" or "#ffffff"
  return checkContrast(color, "#31323f") ? "#31323f" : "#ffffff";
};

/**
 * Display a preview of a palette
 */
export const PalettePreview = ({
  colors,
  size = "2em",
  swatches = 6,
  borderRadius = 0,
  margin = 0,
  showTooltip = false,
  backgroundColor = "transparent",
}) => {
  let width = multiply(size, swatches);
  let unitWidth = multiply(size, swatches, colors.length);
  return colors.map((col, i) => {
    let border;
    if (!checkContrast(col, backgroundColor, 1.01)) {
      border = `1px solid ${getContrastColor(col)}`;
    }
    let span = (
      <span
        style={{
          backgroundColor: col,
          height: size,
          width: unitWidth,
          display: "inline-block",
          borderRadius,
          border,
          boxSizing: "border-box",
          margin,
          ...(showTooltip ? { cursor: "pointer" } : {}),
        }}
        key={i}
      ></span>
    );
    if (showTooltip) {
      span = (
        <Tooltip title={col} key={i} arrow>
          {span}
        </Tooltip>
      );
    }
    return span;
  });
};

export default PalettePreview;
