import { attrTypes } from "../functions/attrTypes";
import { histogramAgg } from "../queries/histogramAgg";

const attributeTerms = ({ terms, size }) => {
  let attribute = terms;
  return {
    reverse_nested: {},
    aggs: {
      by_attribute: {
        nested: {
          path: "attributes",
        },
        aggs: {
          by_cat: {
            filter: {
              term: { "attributes.key": attribute },
            },
            aggs: {
              cats: { terms: { field: "attributes.keyword_value", size } },
            },
          },
        },
      },
    },
  };
};

const attributeCategory = ({ cats, field, histogram }) => {
  let filters = {};
  cats.forEach((obj, i) => {
    filters[obj.key] = { term: { "attributes.keyword_value": obj.key } };
  });
  return {
    reverse_nested: {},
    aggs: {
      by_attribute: {
        nested: {
          path: "attributes",
        },
        aggs: {
          by_cat: {
            filters: {
              filters,
            },
            aggs: {
              histogram: {
                reverse_nested: {},
                aggs: {
                  by_attribute: {
                    nested: {
                      path: "attributes",
                    },
                    aggs: {
                      [field]: {
                        filter: {
                          term: { "attributes.key": field },
                        },
                        aggs: {
                          histogram,
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
  };
};

const nestedHistograms = ({ field, histogram }) => {
  return {
    reverse_nested: {},
    aggs: {
      by_attribute: {
        nested: {
          path: "attributes",
        },
        aggs: {
          // histogram: {
          //   reverse_nested: {},
          //   aggs: {
          //     by_attribute: {
          //       nested: {
          //         path: "attributes",
          //       },
          //       aggs: {
          [field]: {
            filter: {
              term: { "attributes.key": field },
            },
            aggs: {
              histogram,
            },
            //       },
            //     },
            //   },
            // },
          },
        },
      },
    },
  };
};

const treeAgg = ({ field, types, summary }) => {
  let key =
    summary == "value"
      ? `attributes.${types.type}_value`
      : `attributes.${summary}`;
  return {
    reverse_nested: {},
    aggs: {
      taxa: {
        terms: {
          field: "parent",
        },
      },
      // by_attribute: {
      //   nested: {
      //     path: "lineage",
      //   },
      //   aggs: {
      //     layer: {
      //       filter: {
      //         range: { ["lineage.depth"]: { lte: 1 } },
      //       },
      //       aggs: {
      //         taxa: {
      //           terms: {
      //             field: "lineage.taxon_id",
      //           },
      //         },
      //       },
      //     },
      //   },
      // },
    },
  };
};

const lineageTerms = ({ terms, size }) => {
  let rank = terms;
  return {
    reverse_nested: {},
    aggs: {
      by_lineage: {
        nested: {
          path: "lineage",
        },
        aggs: {
          at_rank: {
            filter: {
              term: { "lineage.taxon_rank": rank },
            },
            aggs: {
              taxa: { terms: { field: "lineage.taxon_id", size } },
            },
          },
        },
      },
    },
  };
};

const lineageCategory = ({ cats, field, histogram }) => {
  let filters = {};
  cats.forEach((obj, i) => {
    filters[obj.key] = { term: { "lineage.taxon_id": obj.key } };
  });
  return {
    reverse_nested: {},
    aggs: {
      by_lineage: {
        nested: {
          path: "lineage",
        },
        aggs: {
          at_rank: {
            filters: {
              filters,
            },
            aggs: {
              histogram: {
                reverse_nested: {},
                aggs: {
                  by_attribute: {
                    nested: {
                      path: "attributes",
                    },
                    aggs: {
                      [field]: {
                        filter: {
                          term: { "attributes.key": field },
                        },
                        aggs: {
                          histogram,
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
  };
};

const termsAgg = ({ field, typesMap, size }) => {
  if (!field) {
    return;
  }
  if (typesMap[field]) {
    if (typesMap[field].type == "keyword") {
      return attributeTerms({ terms: field, size });
    }
  } else {
    return lineageTerms({ terms: field, size });
  }
};

export const setAggs = async ({
  field,
  summary,
  result,
  histogram,
  tree,
  stats,
  keywords,
  terms,
  size = 5,
  bounds,
  yField,
  ySummary,
  yBounds,
  taxonomy,
}) => {
  let typesMap = await attrTypes({ result, taxonomy });
  if (!typesMap[field]) {
    if (terms) {
      if (typesMap[terms]) {
        field = terms;
        if (typesMap[terms].type == "keyword") {
          terms = attributeTerms({ terms, size });
          return {
            aggregations: {
              nested: {
                path: "attributes",
              },
              aggs: {
                [field]: {
                  filter: {
                    term: { "attributes.key": field },
                  },
                  aggs: {
                    terms,
                  },
                },
              },
            },
          };
        }
      } else {
        let rank = terms;
        terms = lineageTerms({ terms, size });
        return {
          aggregations: {
            nested: {
              path: "lineage",
            },
            aggs: {
              [field]: {
                filter: {
                  term: { "lineage.taxon_rank": rank },
                },
                aggs: {
                  terms,
                },
              },
            },
          },
        };
      }
    } else {
      return;
    }
  }
  // TODO: use terms aggregation in place of yHistogram

  let yHistogram, yHistograms, categoryHistograms;
  if (histogram && yField) {
    yHistogram = await histogramAgg({
      field: yField,
      summary: ySummary,
      result,
      bounds: yBounds,
      taxonomy,
    });
    yHistograms = nestedHistograms({
      field: yField,
      histogram: yHistogram,
    });
  }
  if (histogram) {
    if (bounds.stats.by) {
      histogram = termsAgg({ field, typesMap, size });
    } else {
      histogram = await histogramAgg({
        field,
        summary,
        result,
        bounds,
        yHistograms,
        taxonomy,
      });
    }
  }
  if (bounds && bounds.cats) {
    if (bounds.by == "attribute") {
      categoryHistograms = attributeCategory({
        cats: bounds.cats,
        field,
        summary,
        histogram,
      });
    } else {
      categoryHistograms = lineageCategory({
        cats: bounds.cats,
        field,
        summary,
        histogram,
      });
    }
  }
  if (stats) {
    stats = {
      stats: {
        field: `attributes.${typesMap[field].type}_value`,
      },
    };
  }
  terms = termsAgg({ field: terms, typesMap, size });
  keywords = termsAgg({ field: keywords, typesMap, size });

  if (tree) {
    tree = await treeAgg({
      field,
      types: typesMap[field],
      summary,
    });
  }

  return {
    aggregations: {
      nested: {
        path: "attributes",
      },
      aggs: {
        [field]: {
          filter: {
            term: { "attributes.key": field },
          },
          aggs: {
            histogram,
            stats,
            keywords,
            terms,
            categoryHistograms,
            tree,
            // yHistograms,
          },
        },
      },
    },
  };
};
