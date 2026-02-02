export const parseValue = (value) => {
  const suffixes = { k: 1e3, M: 1e6, G: 1e9, T: 1e12, P: 1e15 };
  const match = value.match(/^([\d.,\s]+)([kMGTPE])$/i);
  if (match) {
    const [, number, suffix] = match;
    return parseValue(number) * (suffixes[suffix.toUpperCase()] || 1);
  }

  let val = value;
  // Normalize value: remove spaces, handle both ',' and '.' as thousand/decimal separators
  if (typeof val === "string") {
    let normalized = val.replace(/\s/g, " ");
    // Count occurrences of separators
    const commaMatches = (normalized.match(/,/g) || []).length;
    const dotMatches = (normalized.match(/\./g) || []).length;
    const spaceMatches = (normalized.match(/ /g) || []).length;

    // Helper to check if all separators are in groups of 3 digits
    const isThousandGrouped = (str, sep) => {
      const parts = str.split(sep);
      // Ignore first group (could be less than 3)
      return parts.slice(1).every((p) => p.length === 3);
    };

    if (commaMatches > 1 && isThousandGrouped(normalized, ",")) {
      // Multiple commas, likely thousand separator
      normalized = normalized.replace(/,/g, "");
    } else if (dotMatches > 1 && isThousandGrouped(normalized, ".")) {
      // Multiple dots, likely thousand separator
      normalized = normalized.replace(/\./g, "");
    } else if (spaceMatches > 0 && isThousandGrouped(normalized, " ")) {
      // Spaces as thousand separator
      normalized = normalized.replace(/ /g, "");
    } else if (commaMatches === 1) {
      // Single comma: check if it's a thousand separator (3 digits after)
      const [intPart, fracPart] = normalized.split(",");
      if (fracPart && fracPart.length === 3) {
        normalized = normalized.replace(/,/g, "");
      } else {
        // Otherwise, treat as decimal
        normalized = normalized.replace(/,/g, ".");
      }
    } else if (dotMatches === 1) {
      // Single dot: check if it's a thousand separator (3 digits after)
      // const [intPart, fracPart] = normalized.split(".");
      // if (fracPart && fracPart.length === 3) {
      //   normalized = normalized.replace(/\./g, "");
      // }
      // else leave as is (decimal)
    }
    val = normalized.replace(/ /g, "");
  }

  if (val === null || val === undefined || val === "") {
    return null; // Return null for empty values
  }
  if (!isNaN(val)) {
    return Number(val);
  }

  return val; // Return as-is if no suffix is found
};

export default parseValue;
