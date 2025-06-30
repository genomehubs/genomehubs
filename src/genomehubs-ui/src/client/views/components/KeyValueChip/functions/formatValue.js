// Format numbers with suffixes (k, M, G, etc.)
export const formatValue = (val) => {
  if (val === null || val === undefined || val == "") {
    return ""; // Return empty string for null or undefined values
  }
  if (isNaN(val)) {
    return val; // Return non-numeric values as-is
  }
  const suffixes = ["", "k", "M", "G", "T", "P"];
  let num = parseFloat(val);
  let tier = 0;

  while (num >= 1000 && tier < suffixes.length - 1) {
    const nextNum = num / 1000;
    if (nextNum.toString().match(/^\d+\.\d{4}/)) {
      return (num * Math.pow(10, tier * 3)).toLocaleString(); // Format the number with commas
    } else {
      num = nextNum;
      tier++;
    }
  }

  return tier === 0 ? num.toString() : `${num}${suffixes[tier]}`;
};

export default formatValue;
