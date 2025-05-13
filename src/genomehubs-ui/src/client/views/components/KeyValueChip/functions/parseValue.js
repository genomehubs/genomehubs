export const parseValue = (val) => {
  const suffixes = { k: 1e3, M: 1e6, G: 1e9, T: 1e12, P: 1e15 };
  const match = val.replace(",", "").match(/^([\d.]+)([kMGTPE]?)$/);
  if (!match) {
    return val; // Return as-is if no suffix is found
  }
  const [, number, suffix] = match;
  return parseFloat(number) * (suffixes[suffix] || 1);
};

export default parseValue;
