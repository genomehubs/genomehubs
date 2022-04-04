import { attrTypes } from "../functions/attrTypes";
import { histogramAgg } from "../queries/histogramAgg";

const attributeTerms = ({ cat, terms, size, yHistograms }) => {
  let filter;
  let filters;
  let attribute;
  if (typeof terms === "object") {
    attribute = terms.cat || cat;
    terms = terms.terms;
  }
  if (Array.isArray(terms)) {
    if (terms.length > 0) {
      filters = {};
      let i = 0;
      for (let obj of terms) {
        i += 1;
        if (i > size) {
          break;
        }
        filters[obj.key] = { term: { "attributes.keyword_value": obj.key } };
      }
      filters = { other_bucket_key: "other", filters: { ...filters } };
    }
  } else {
    attribute = terms;
  }
  let by_value;
  if (filters) {
    by_value = {
      filters,
      aggs: {
        cats: {
          terms: { field: "attributes.keyword_value", size },
          ...(yHistograms && {
            aggs: {
              yHistograms,
            },
          }),
        },
      },
    };
  }

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
              by_value,
              more_values: {
                terms: { field: "attributes.keyword_value", size },
                ...(yHistograms && {
                  aggs: {
                    yHistograms,
                  },
                }),
              },
            },
          },
        },
      },
    },
  };
};

const attributeCategory = ({ cat, cats, field, histogram, other }) => {
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
            filter: {
              term: { "attributes.key": cat },
            },
            aggs: {
              by_value: {
                filters: {
                  filters,
                  ...(other && { other_bucket_key: "other" }),
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

const lineageCategory = ({ cats, field, histogram, other }) => {
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
              ...(other && { other_bucket_key: "other" }),
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

const termsAgg = ({ field, fixedTerms, typesMap, size, yHistograms }) => {
  if (!field) {
    return;
  }
  if (typesMap[field]) {
    if (typesMap[field].type == "keyword") {
      return attributeTerms({
        cat: field,
        terms: fixedTerms || field,
        size,
        yHistograms,
      });
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
  fixedTerms,
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

  let yHistogram, yHistograms, categoryHistograms;
  if (histogram && yField) {
    if (yBounds.stats.by) {
      let boundsTerms = { terms: yBounds.stats.cats };
      yHistogram = termsAgg({
        field: yField,
        fixedTerms: boundsTerms,
        typesMap,
        size: yBounds.stats.size,
      });
    } else {
      yHistogram = await histogramAgg({
        field: yField,
        summary: ySummary,
        result,
        bounds: yBounds,
        taxonomy,
      });
    }
    yHistograms = nestedHistograms({
      field: yField,
      histogram: yHistogram,
    });
  }
  if (histogram) {
    if (fixedTerms && fixedTerms.terms) {
      histogram = termsAgg({
        field,
        fixedTerms: fixedTerms,
        typesMap,
        size: bounds.stats.size,
        yHistograms,
      });
    } else if (bounds.stats.by) {
      let boundsTerms = { terms: bounds.stats.cats };
      histogram = termsAgg({
        field,
        fixedTerms: boundsTerms,
        typesMap,
        size: bounds.stats.size,
        yHistograms,
      });
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
        cat: bounds.cat,
        cats: bounds.cats,
        field,
        summary,
        histogram,
        other: bounds.showOther,
      });
    } else {
      categoryHistograms = lineageCategory({
        cat: bounds.cat,
        cats: bounds.cats,
        field,
        summary,
        histogram,
        other: bounds.showOther,
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
  keywords = termsAgg({
    field: keywords,
    fixedTerms: fixedTerms ? fixedTerms : undefined,
    typesMap,
    size: fixedTerms ? fixedTerms.size : 5,
  });

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
