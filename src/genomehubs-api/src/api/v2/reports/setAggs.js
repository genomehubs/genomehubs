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
      ...(yHistograms && {
        aggs: {
          cats: {
            terms: { field: "attributes.keyword_value", size },
            aggs: {
              yHistograms,
            },
          },
        },
      }),
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

const treeAgg = () => {
  return {
    reverse_nested: {},
    aggs: {
      taxa: {
        terms: {
          field: "parent",
        },
      },
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

const termsAgg = ({ field, fixedTerms, lookupTypes, size, yHistograms }) => {
  if (!field) {
    return;
  }
  let fieldMeta = lookupTypes(field);
  if (fieldMeta) {
    if (fieldMeta.type == "keyword") {
      return attributeTerms({
        cat: fieldMeta.name,
        terms: fixedTerms || fieldMeta.name,
        size,
        yHistograms,
      });
    }
  } else {
    // TODO: check this is a valid rank
    return lineageTerms({ terms: field, size });
  }
};

export const setAggs = async ({
  field,
  summary,
  valueKey,
  result,
  histogram,
  tree,
  stats,
  geo,
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
  let { lookupTypes } = await attrTypes({ result, taxonomy });
  let fieldMeta = lookupTypes(field);
  if (!fieldMeta) {
    if (terms) {
      fieldMeta = lookupTypes(terms);
      field = fieldMeta.name;
      if (fieldMeta) {
        if (fieldMeta.type == "keyword" && valueKey == "keyword_value") {
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
        lookupTypes,
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
        lookupTypes,
        size: bounds.stats.size,
        yHistograms,
      });
    } else if (bounds.stats.by) {
      let boundsTerms = { terms: bounds.stats.cats };
      histogram = termsAgg({
        field,
        fixedTerms: boundsTerms,
        lookupTypes,
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
        field: `attributes.${valueKey}`,
      },
    };
  }
  if (geo) {
    geo = {
      geo_bounds: {
        field: `attributes.${fieldMeta.type}_value`,
        wrap_longitude: true,
      },
    };
  }
  terms = termsAgg({ field: terms, lookupTypes, size });
  keywords = termsAgg({
    field: keywords,
    fixedTerms: fixedTerms || undefined,
    lookupTypes,
    size: fixedTerms ? fixedTerms.size : 5,
  });

  if (tree) {
    tree = treeAgg();
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
            geo,
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
