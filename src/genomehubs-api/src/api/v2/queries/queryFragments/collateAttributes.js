import { client } from "../../functions/connection";
import { logError } from "../../functions/logger";

export const collateAttributes = async ({ query, collateTerm, index }) => {
  if (!collateTerm) {
    return [];
  }
  let [attrA, attrB, count = 2] = collateTerm.split(",");
  let terms = [];

  // Fetch top level filter terms
  let { body } = await client
    .search({
      index,
      body: {
        query,
        size: 0,
        aggs: {
          attributes: {
            nested: {
              path: "attributes",
            },
            aggs: {
              by_key: {
                filter: {
                  term: { "attributes.key": attrA },
                },
                aggs: {
                  by_value: {
                    terms: { field: "attributes.keyword_value", size: 1000 },
                    aggs: {
                      rev: {
                        reverse_nested: {},
                        aggs: {
                          attributes: {
                            nested: {
                              path: "attributes",
                            },
                            aggs: {
                              by_key: {
                                filter: {
                                  term: { "attributes.key": attrB },
                                },
                                aggs: {
                                  by_value: {
                                    terms: {
                                      field: "attributes.keyword_value",
                                      size: 1000,
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
            },
          },
        },
      },
      rest_total_hits_as_int: true,
    })
    .catch((err) => {
      logError({
        message: err.meta.body.error,
      });
      return err.meta;
    });
  if (body && body.hits && body.hits.total) {
    let byValue = {};
    for (let bucketA of body.aggregations.attributes.by_key.by_value.buckets) {
      for (let bucketB of bucketA.rev.attributes.by_key.by_value.buckets) {
        if (!byValue[bucketB.key]) {
          byValue[bucketB.key] = 0;
        }
        byValue[bucketB.key] += 1;
        if (byValue[bucketB.key] == count) {
          terms.push(bucketB.key);
        }
      }
    }
  }
  let filter = [];
  if (terms) {
    filter = [
      {
        nested: {
          path: "attributes",
          query: {
            bool: {
              filter: [
                { match: { "attributes.key": attrB } },
                {
                  bool: {
                    should: terms.map((term) => ({
                      match: { ["attributes.keyword_value"]: term },
                    })),
                  },
                },
              ],
            },
          },
        },
      },
    ];
  }
  return filter;
};
