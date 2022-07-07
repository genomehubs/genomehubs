export const aggregateNameClasses = async ({}) => {
  return {
    size: 0,
    query: {
      match_all: {},
    },
    aggs: {
      taxon_names: {
        nested: {
          path: "taxon_names",
        },
        aggs: {
          class: {
            terms: {
              field: "taxon_names.class",
              size: 200,
            },
          },
        },
      },
    },
  };
};
