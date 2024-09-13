import { format } from "d3-format";

const toReturnType = (value, formatted, returnType) => {
  if (returnType == "array") {
    return { values: [[value, 1]], formatted: [formatted] };
  }
  return formatted;
};

const sortByFrequency = (arr) => {
  const frequencyMap = arr.reduce((obj, value) => {
    value = formatter(value);
    obj[value] = (obj[value] || 0) + 1;
    return obj;
  }, {});

  return Object.entries(frequencyMap).sort((a, b) => b[1] - a[1]);
};

export const formatter = (value, searchIndex, returnType, limit = 15) => {
  if (Number.isNaN(value)) {
    if (Array.isArray(value)) {
      let extra = value.length > 5 && value.length - 5;
      let values = sortByFrequency(value).slice(0, limit);
      if (!returnType) {
        values = values.slice(0, 5);
      }
      let formatted;
      if (returnType == "array") {
        formatted = values.map((arr) => `${arr[0]}`);
        return { values, formatted, extra };
      }
      formatted = values.map(
        (arr) => `${arr[0]}${arr[1] > 1 ? ` (${arr[1]})` : ""}`,
      );
      return `${formatted.join("; ")}${extra ? "; ..." : ""}`;
    }
    let parts = (value || "").split(/\s*,\s*/);
    if (
      parts.length == 2 &&
      !Number.isNaN(parts[0] && !Number.isNaN(parts[1]))
    ) {
      value = parts.map((p) => format(".2f")(p, searchIndex)).join(",");
    }
    let formatted = value;
    return toReturnType(value, formatted, returnType);
  }
  if (searchIndex == "feature") {
    return toReturnType(value, value.toLocaleString(), returnType);
  }
  if (value < 1000 && value >= 0.001) {
    return toReturnType(value, format(",.3~r")(value), returnType);
  }
  return toReturnType(value, format(",.3~s")(value), returnType);
};

export default formatter;
