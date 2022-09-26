export const charWidth = (char, options = { factor: 0.7 }) => {
  const { factor } = options;
  const widths = {
    dot: 2,
    number: 7,
    a: 5,
    g: 7,
    i: 4,
    j: 4.5,
    m: 8,
    M: 10,
  };
  const chars = {};
  [".", ",", ";", ":", "|", "!", "\\", "/", " "].forEach((char) => {
    chars[char] = widths.dot;
  });
  [...Array(10).keys()].forEach((char) => {
    chars[char] = widths.number;
  });
  ["g"].forEach((char) => {
    chars[char] = widths.g;
  });
  ["i", "l", 1].forEach((char) => {
    chars[char] = widths.i;
  });
  ["j", "t", "-"].forEach((char) => {
    chars[char] = widths.j;
  });
  ["m", "w"].forEach((char) => {
    chars[char] = widths.m;
  });
  ["M", "W"].forEach((char) => {
    chars[char] = widths.M;
  });
  let width = widths.a;
  if (chars[char]) {
    width = chars[char];
  } else if (chars[char.toLowerCase()]) {
    width = widths.m;
  }
  return (width / widths.a) * factor;
};

export default charWidth;
