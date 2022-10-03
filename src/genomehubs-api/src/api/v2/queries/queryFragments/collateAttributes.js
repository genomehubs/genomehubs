import { client } from "../../functions/connection";
import { logError } from "../../functions/logger";

export const collateAttributes = async ({
  query,
  collateTerm,
  lookupTypes,
  index,
}) => {
  if (!collateTerm) {
    return [];
  }
  let [attrA, attrB, count = 2] = collateTerm.split(",");
  let terms = [];

  let aggB = {
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
                  size: 16384,
                },
              },
            },
          },
        },
      },
    },
  };

  let aggs, nested;

  if (lookupTypes(attrA)) {
    nested = true;
    aggs = {
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
                terms: { field: "attributes.keyword_value", size: 16384 },
                aggs: {
                  rev: {
                    reverse_nested: {},
                    ...aggB,
                  },
                },
              },
            },
          },
        },
      },
    };
  } else {
    aggs = {
      by_value: {
        terms: { field: attrA, size: 16384 },
        ...aggB,
      },
    };
  }

  // Fetch top level filter terms
  let { body } = await client
    .search({
      index,
      body: {
        query,
        size: 0,
        aggs,
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
    let bucketsA = nested
      ? body.aggregations.attributes.by_key.by_value.buckets
      : body.aggregations.by_value.buckets;
    for (let bucketA of bucketsA) {
      let bucketsB = nested
        ? bucketA.rev.attributes.by_key.by_value.buckets
        : bucketA.attributes.by_key.by_value.buckets;
      for (let bucketB of bucketsB) {
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
                  terms_set: {
                    ["attributes.keyword_value"]: {
                      terms,
                      minimum_should_match_script: { source: "1" },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    ];
    // filter = [
    //   {
    //     nested: {
    //       path: "attributes",
    //       query: {
    //         bool: {
    //           filter: [
    //             { match: { "attributes.key": attrB } },
    //             {
    //               bool: {
    //                 should: terms.map((term) => ({
    //                   match: { ["attributes.keyword_value"]: term },
    //                 })),
    //               },
    //             },
    //           ],
    //         },
    //       },
    //     },
    //   },
    // ];
  }
  return filter;
};
