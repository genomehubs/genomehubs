export const subsets = {
  source: new Set(["ancestor", "descendant", "direct", "estimate"]),
  estimate: new Set(["ancestor", "descendant"]),
  summary: new Set([
    "count",
    "length",
    "max",
    "mean",
    "median",
    "min",
    "mode",
    "range",
    "value",
  ]),
};
