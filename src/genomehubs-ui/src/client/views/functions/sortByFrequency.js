import { formatter } from "./formatter";

export const sortByFrequency = (arr) => {
  const frequencyMap = arr.reduce((obj, value) => {
    value = formatter(value);
    obj[value] = (obj[value] || 0) + 1;
    return obj;
  }, {});

  return Object.entries(frequencyMap).sort(
    (a, b) =>
      b[1] - a[1] ||
      a[0].localeCompare(b[0], undefined, {
        numeric: true,
        sensitivity: "base",
      })
  );
};
