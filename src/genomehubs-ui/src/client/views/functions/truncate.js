export const truncate = (str, maxLen = 100) => {
  if (str.length > maxLen + 3) {
    return str.slice(0, maxLen) + "...";
  }
  return str;
};

export default truncate;
