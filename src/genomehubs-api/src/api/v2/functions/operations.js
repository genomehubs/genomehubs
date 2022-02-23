export const operations = (str) => {
  const translate = {
    ">": ["gt"],
    ">=": ["gte"],
    "<": ["lt"],
    "<=": ["lte"],
    "=": ["gte", "lte"],
    "!=": ["ne", "gte", "lte"],
  };
  let operator = translate[str];
  return operator || [];
};
