export const parseValue = (val) => {
  const suffixes = { k: 1e3, M: 1e6, G: 1e9, T: 1e12, P: 1e15 };
  let value =
    val?.toString().trim().replaceAll(",", "").replaceAll(/\s+/g, "") || "";
  const match = value.match(/^([\d.]+)([kMGTPE]?)$/);
  if (!match) {
    return value; // Return as-is if no suffix is found
  }
  const [, number, suffix] = match;
  return parseFloat(number) * (suffixes[suffix] || 1);
};

export default parseValue;
