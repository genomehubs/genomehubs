export const mixColor = ({ color1, color2, ratio }) => {
  const hexToRgb = (hex) => {
    let bigint = parseInt(hex.slice(1), 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return [r, g, b];
  };

  const hslToRgb = (h, s, l) => {
    let r, g, b;

    if (s == 0) {
      r = g = b = l;
    } else {
      let hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      let p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [r * 255, g * 255, b * 255];
  };

  const rgbToHex = (r, g, b) => {
    return (
      "#" +
      ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
    );
  };

  const parseColor = (color) => {
    console.log(color);
    if (color.startsWith("#")) {
      return hexToRgb(color);
    } else if (color.startsWith("rgb")) {
      return color.match(/\d+/g).map(Number);
    } else if (color.startsWith("hsl")) {
      return hslToRgb(...color.match(/\d+/g).map(Number));
    }
    throw new Error("Invalid color format");
  };

  if (typeof color1 == "undefined" || typeof color2 == "undefined") {
    return;
  }

  let [r1, g1, b1] = parseColor(color1);
  let [r2, g2, b2] = parseColor(color2);

  let r = Math.ceil(r1 * ratio + r2 * (1 - ratio));
  let g = Math.ceil(g1 * ratio + g2 * (1 - ratio));
  let b = Math.ceil(b1 * ratio + b2 * (1 - ratio));

  return rgbToHex(r, g, b);
};
