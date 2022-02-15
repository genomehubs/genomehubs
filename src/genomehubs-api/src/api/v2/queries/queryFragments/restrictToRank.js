export const restrictToRank = (rank) => {
  if (rank) {
    return [
      {
        match: {
          taxon_rank: rank,
        },
      },
    ];
  }
  return [];
};
