import { format } from "d3-format";
import { sortByFrequency } from "./sortByFrequency";

const toReturnType = (value, formatted, returnType) => {
  if (returnType == "array") {
    return { values: [[value, 1]], formatted: [formatted] };
  }
  return formatted;
};

export const formatter = (value, searchIndex, returnType) => {
  if (isNaN(value)) {
    if (Array.isArray(value)) {
      let extra = value.length > 5 && value.length - 5;
      let values = sortByFrequency(value);
      if (!returnType) {
        values = values.slice(0, 5);
      }
      let formatted;
      if (returnType == "array") {
        formatted = values.map((arr) => `${arr[0]}`);
        return { values, formatted, extra };
      }
      formatted = values.map(
        (arr) => `${arr[0]}${arr[1] > 1 ? ` (${arr[1]})` : ""}`
      );
      return `${formatted.join("; ")}${extra ? "; ..." : ""}`;
    }
    let parts = value.split(",");
    let formatted = value;
    if (parts.length == 2 && !isNaN(parts[0] && !isNaN(parts[1]))) {
      value = parts.map((p) => format(".2f")(p, searchIndex)).join(",");
    }
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
