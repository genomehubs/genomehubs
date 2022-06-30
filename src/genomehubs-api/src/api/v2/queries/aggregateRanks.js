export const aggregateRanks = async ({}) => {
  return {
    size: 0,
    query: {
      match_all: {},
    },
    aggs: {
      lineage: {
        nested: {
          path: "lineage",
        },
        aggs: {
          ranks: {
            terms: {
              field: "lineage.taxon_rank",
              size: 200,
            },
          },
        },
      },
    },
  };
};
