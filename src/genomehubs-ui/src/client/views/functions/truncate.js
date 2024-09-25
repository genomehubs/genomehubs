export const truncate = (str, maxLen = 100, left) => {
  if (str.length > maxLen + 3) {
    if (left) {
      return "..." + str.slice(str.length - maxLen);
    }
    return str.slice(0, maxLen) + "...";
  }
  return str;
};

export default truncate;
