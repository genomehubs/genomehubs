export const mixColor = ({ color1, color2, ratio }) => {
  const hexToRgba = (hex) => {
    let bigint = parseInt(hex.slice(1), 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    let a = hex.length === 9 ? (bigint & 255) / 255 : 1;
    return [r, g, b, a];
  };

  const hslToRgba = (h, s, l, a = 1) => {
    let r, g, b;

    if (s == 0) {
      r = g = b = l;
    } else {
      let hue2rgb = (p, q, t) => {
        if (t < 0) {
          t += 1;
        }
        if (t > 1) {
          t -= 1;
        }
        if (t < 1 / 6) {
          return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
          return q;
        }
        if (t < 2 / 3) {
          return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
      };

      let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      let p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [r * 255, g * 255, b * 255, a];
  };

  const rgbToHex = (r, g, b, a = 1) => {
    let hex =
      "#" +
      ((1 << 24) + (r << 16) + (g << 8) + b)
        .toString(16)
        .slice(1)
        .toUpperCase();
    if (a < 1) {
      let alphaHex = Math.round(a * 255)
        .toString(16)
        .toUpperCase();
      if (alphaHex.length === 1) {
        alphaHex = "0" + alphaHex;
      }
      hex += alphaHex;
    }
    return hex;
  };

  const parseColor = (color) => {
    if (color.startsWith("#")) {
      return hexToRgba(color);
    } else if (color.startsWith("rgba")) {
      return color.match(/[\d\.]+/g).map(Number);
    } else if (color.startsWith("rgb")) {
      return color.match(/[\d\.]+/g).map(Number);
    } else if (color.startsWith("hsl")) {
      return hslToRgba(...color.match(/[\d\.]+/g).map(Number));
    }
    throw new Error("Invalid color format");
  };

  // if one color is missing, return the other
  if (typeof color1 == "undefined") {
    return color2;
  }
  if (typeof color2 == "undefined") {
    return color1;
  }

  // if one color has transparency, mix it with the other color

  let [r1, g1, b1, a1] = parseColor(color1);
  let [r2, g2, b2, a2] = parseColor(color2);
  // if one color has transparency, mix it with the other color
  if (a1 < 1) {
    r1 = r1 * a1 + r2 * (1 - a1);
    g1 = g1 * a1 + g2 * (1 - a1);
    b1 = b1 * a1 + b2 * (1 - a1);
  }
  if (a2 < 1) {
    r2 = r1 * a2 + r2 * (1 - a2);
    g2 = g1 * a2 + g2 * (1 - a2);
    b2 = b1 * a2 + b2 * (1 - a2);
  }

  let r = Math.floor(r1 * ratio + r2 * (1 - ratio));
  let g = Math.floor(g1 * ratio + g2 * (1 - ratio));
  let b = Math.floor(b1 * ratio + b2 * (1 - ratio));

  return rgbToHex(r, g, b);
};
