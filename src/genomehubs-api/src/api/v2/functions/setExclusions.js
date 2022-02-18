export const setExclusions = ({
  excludeAncestral,
  excludeDescendant,
  excludeDirect,
  excludeMissing,
  excludeUnclassified,
}) => {
  let exclusions = {};
  if (excludeAncestral) {
    exclusions.ancestor = excludeAncestral;
  }
  if (excludeDescendant) {
    exclusions.descendant = excludeDescendant;
  }
  if (excludeDirect) {
    exclusions.direct = excludeDirect;
  }
  if (excludeMissing) {
    exclusions.missing = excludeMissing;
  }
  if (excludeUnclassified) {
    exclusions.unclassified = excludeUnclassified;
  }
  return exclusions;
};
