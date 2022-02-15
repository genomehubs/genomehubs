import { format } from "d3-format";
import { sortByFrequency } from "./sortByFrequency";

export const formatter = (value) => {
  if (isNaN(value)) {
    if (Array.isArray(value)) {
      const values = sortByFrequency(value);
      return values
        .map((arr) => `${arr[0]} (${arr[1]})`)
        .slice(0, 5)
        .join("; ");
    }
    return value;
  }
  if (value < 1000 && value >= 0.001) {
    return format(",.3~r")(value);
  }
  return format(",.3~s")(value);
};

export default formatter;
