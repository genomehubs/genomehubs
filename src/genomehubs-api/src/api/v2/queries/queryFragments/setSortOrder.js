const ranks = {
  superkingdom: true,
  kingdom: true,
  phylum: true,
  class: true,
  order: true,
  family: true,
  genus: true,
  species: true,
  subspecies: true,
};

export const setSortOrder = (sortBy, typesMap, namesMap = {}) => {
  if (sortBy) {
    if (sortBy.by == "scientific_name" || sortBy.by == "taxon_id") {
      return [
        {
          [sortBy.by]: {
            mode: sortBy.mode || "max",
            order: sortBy.order || "asc",
          },
        },
      ];
    } else if (ranks[sortBy.by]) {
      return [
        {
          [`lineage.scientific_name`]: {
            mode: sortBy.mode || "max",
            order: sortBy.order || "asc",
            nested: {
              path: "lineage",
              filter: {
                term: { "lineage.taxon_rank": sortBy.by },
              },
            },
          },
        },
      ];
    } else if (namesMap[sortBy.by]) {
      return [
        {
          [`taxon_names.name`]: {
            mode: sortBy.mode || "max",
            order: sortBy.order || "asc",
            nested: {
              path: "taxon_names",
              filter: {
                term: { "taxon_names.class": sortBy.by },
              },
            },
          },
        },
      ];
    } else if (typesMap[sortBy.by]) {
      return [
        {
          [`attributes.${typesMap[sortBy.by].type}_value`]: {
            mode: sortBy.mode || "max",
            order: sortBy.order || "asc",
            nested: {
              path: "attributes",
              filter: {
                term: { "attributes.key": sortBy.by },
              },
            },
          },
        },
      ];
    }
  }
  return [];
};
