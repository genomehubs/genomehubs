import hexToHSL from "hex-to-hsl";

export const fadeColor = ({ hex, i, active }) => {
  let [h, s, l] = hexToHSL(hex);
  let lighten = active !== false ? i != active : false;
  if (lighten) {
    s = 15;
    l = (l + 100) / 2;
  }
  return `hsl(${h},${s}%,${l}%)`;
};

export default fadeColor;
