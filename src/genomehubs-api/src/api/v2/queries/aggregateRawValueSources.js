const termsAgg = async () => {
  return {
    terms: {
      field: "attributes.values.source",
      size: 200,
    },
  };
};

export const aggregateRawValueSources = async ({}) => {
  let terms = await termsAgg();
  return {
    size: 0,
    query: {
      match_all: {},
    },
    aggs: {
      attributes: {
        nested: {
          path: "attributes",
        },
        aggs: {
          fields: {
            terms: {
              field: "attributes.key",
              size: 200,
            },

            aggs: {
              summary: {
                nested: {
                  path: "attributes.values",
                },
                aggs: {
                  terms: {
                    terms: {
                      field: "attributes.values.source",
                      size: 200,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
};
