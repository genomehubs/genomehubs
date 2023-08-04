const termsAgg = async () => {
  return {
    terms: {
      field: "attributes.values.source.raw",
      size: 200,
    },
  };
};

export const rawValueSourceAggregation = () => ({
  attributes: {
    nested: {
      path: "attributes",
    },
    aggs: {
      direct: {
        filter: {
          match: { ["attributes.aggregation_source"]: "direct" },
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
                      field: "attributes.values.source.raw",
                      size: 200,
                    },
                    aggs: {
                      min_date: {
                        min: {
                          field: "attributes.values.source_date",
                          format: "yyyy-MM-dd",
                        },
                      },
                      max_date: {
                        max: {
                          field: "attributes.values.source_date",
                          format: "yyyy-MM-dd",
                        },
                      },
                      url: {
                        terms: {
                          field: "attributes.values.source_url",
                          size: 1,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

export const aggregateRawValueSources = async ({
  query = {
    match_all: {},
  },
}) => {
  return {
    size: 0,
    query,
    aggs: rawValueSourceAggregation(),
  };
};
