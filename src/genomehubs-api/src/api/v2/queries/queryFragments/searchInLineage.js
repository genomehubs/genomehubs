export const searchInLineage = (searchTerm, ancestral, depths) => {
  if (ancestral) {
    return [
      {
        nested: {
          path: "lineage",
          query: {
            bool: {
              filter: [
                {
                  multi_match: {
                    query: searchTerm,
                    fields: ["lineage.taxon_id", "lineage.scientific_name"],
                  },
                },
              ].concat(depths),
            },
          },
        },
      },
    ];
  }
  return [];
};
