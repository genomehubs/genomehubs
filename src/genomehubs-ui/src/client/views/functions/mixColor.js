export const mixColor = ({ color1, color2, ratio }) => {
  let hex = (x) => {
    x = x.toString(16);
    return x.length == 1 ? "0" + x : x;
  };
  let r = Math.ceil(
    parseInt(color1.slice(1, 3), 16) * ratio +
      parseInt(color2.slice(1, 3), 16) * (1 - ratio),
  );
  let g = Math.ceil(
    parseInt(color1.slice(3, 5), 16) * ratio +
      parseInt(color2.slice(3, 5), 16) * (1 - ratio),
  );
  let b = Math.ceil(
    parseInt(color1.slice(5, 7), 16) * ratio +
      parseInt(color2.slice(5, 7), 16) * (1 - ratio),
  );
  return `#${hex(r)}${hex(g)}${hex(b)}`;
};
