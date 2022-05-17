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

export const setSortOrder = (sortBy, lookupTypes, lookupNames = () => {}) => {
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
    } else if (lookupNames(sortBy.by)) {
      return [
        {
          [`taxon_names.name`]: {
            mode: sortBy.mode || "max",
            order: sortBy.order || "asc",
            nested: {
              path: "taxon_names",
              filter: {
                term: { "taxon_names.class": lookupNames(sortBy.by).class },
              },
            },
          },
        },
      ];
    } else if (lookupTypes(sortBy.by)) {
      return [
        {
          [`attributes.${lookupTypes(sortBy.by).type}_value`]: {
            mode: sortBy.mode || "max",
            order: sortBy.order || "asc",
            nested: {
              path: "attributes",
              filter: {
                term: { "attributes.key": lookupTypes(sortBy.by).name },
              },
            },
          },
        },
      ];
    }
  }
  return [];
};
