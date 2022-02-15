export const limitDepth = (depth, gte) => {
  if (depth) {
    if (gte) {
      gte = depth;
    } else {
      gte = 0;
    }
    return [
      {
        range: {
          "lineage.node_depth": { gte, lte: depth },
        },
      },
    ];
  }
  return [];
};
