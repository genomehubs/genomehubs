export const setRanks = (rank) => {
  if (rank) {
    return rank.split(/[,;\s]+/);
  } else {
    return [
      "domain",
      "kingdom",
      "phylum",
      "class",
      "order",
      "family",
      "genus",
      "species",
      "subspecies",
    ];
  }
};
