export const setRanks = (rank) => {
  if (rank) {
    return rank.split(/[,;\s]+/);
  } else {
    return [
      "superkingdom",
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
