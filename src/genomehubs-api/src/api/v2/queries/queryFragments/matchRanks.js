export const matchRanks = (ranks = {}, maxDepth) => {
  ranks = Object.keys(ranks);
  if (ranks.length == 0 && !maxDepth) return [];
  let depthLimit;
  if (maxDepth) {
    depthLimit = {
      filter: { range: { "lineage.node_depth": { lte: maxDepth } } },
    };
  }
  return [
    {
      bool: {
        should: [
          {
            nested: {
              path: "lineage",
              query: {
                bool: {
                  should: ranks.map((rank) => ({
                    bool: {
                      filter: { match: { "lineage.taxon_rank": rank } },
                    },
                  })),
                  ...(depthLimit && depthLimit),
                },
              },
              inner_hits: {
                _source: false,
                docvalue_fields: [
                  "lineage.taxon_id",
                  "lineage.taxon_rank",
                  "lineage.node_depth",
                  "lineage.scientific_name.raw",
                  "lineage.support_value",
                ],
                size: 100,
              },
            },
          },
          { match_all: {} },
        ],
      },
    },
  ];
};
