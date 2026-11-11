import { memberValues, slotCount, termsWithinSize } from "./catMembers.js";

import { attrTypes } from "../functions/attrTypes.js";
import { histogramAgg } from "../queries/histogramAgg.js";

// One term for a single value, or a terms query when aliased values are merged
const matchValues = (field, obj) => {
  const values = memberValues(obj);
  if (values.length > 1) {
    return { terms: { [field]: values } };
  }
  return { term: { [field]: obj.key } };
};

const attributeTerms = ({
  cat,
  terms,
  size,
  yHistograms,
  type = "keyword",
  summary = "value",
}) => {
  let filter;
  let filters;
  let attribute;
  if (typeof terms === "object") {
    attribute = terms.cat || cat;
    terms = terms.terms;
  }
  let field;
  if (summary == "value") {
    field = `attributes.${type}_value`;
  } else {
    field = `attributes.${summary}`;
  }

  // Top values fetched for filling slots; named members can take up to slotCount of them
  let moreValuesSize = size;
  if (Array.isArray(terms)) {
    if (terms.length > 0) {
      filters = {};
      for (let obj of termsWithinSize(terms, size)) {
        filters[obj.key] = matchValues(field, obj);
      }
      filters = { other_bucket_key: "other", filters: { ...filters } };
      moreValuesSize = size + slotCount(terms);
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
                terms: { field, size: moreValuesSize },
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
  if (!cats || cats.length == 0) {
    return;
  }
  let filters = {};
  cats.forEach((obj, i) => {
    filters[obj.key] = matchValues("attributes.keyword_value", obj);
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
  cats.forEach((obj) => {
    filters[obj.key] = { terms: { "lineage.taxon_id": memberValues(obj) } };
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

// counts root docs with any lineage entry at the given rank
const rankPresentAgg = (rank) => ({
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
            docs: { reverse_nested: {} },
          },
        },
      },
    },
  },
});

const termsAgg = ({
  field,
  fixedTerms,
  lookupTypes,
  size,
  yHistograms,
  type,
  summary = "value",
}) => {
  if (!field) {
    return;
  }
  let fieldMeta = lookupTypes(field);
  if (fieldMeta) {
    if (
      fieldMeta.type == "keyword" ||
      fieldMeta.type == "geo_hex" ||
      (fieldMeta.type == "geo_point" && summary.startsWith("hexbin"))
    ) {
      return attributeTerms({
        cat: fieldMeta.name,
        terms: fixedTerms || fieldMeta.name,
        size,
        yHistograms,
        type: fieldMeta.type,
        summary,
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
    if (yBounds && yBounds.stats.by) {
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
        summary,
        fixedTerms: fixedTerms,
        lookupTypes,
        size: bounds.stats.size,
        yHistograms,
      });
    } else if (bounds.stats.by) {
      let boundsTerms = { terms: bounds.stats.cats };
      histogram = termsAgg({
        field,
        summary,
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
        other: bounds.stats.showOther,
      });
    } else {
      categoryHistograms = lineageCategory({
        cat: bounds.cat,
        cats: bounds.cats,
        field,
        summary,
        histogram,
        other: bounds.stats.showOther,
      });
    }
  }
  // docs with no lineage entry at the category rank would otherwise be counted in other
  if (
    histogram &&
    bounds?.by == "lineage" &&
    bounds.cat &&
    bounds.stats?.showOther &&
    !bounds.stats.by
  ) {
    histogram = {
      ...histogram,
      aggs: { ...histogram.aggs, with_rank: rankPresentAgg(bounds.cat) },
    };
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
  if (keywords) {
    keywords = termsAgg({
      field: keywords,
      fixedTerms: fixedTerms || undefined,
      lookupTypes,
      size: fixedTerms ? fixedTerms.size : 5,
      type: fieldMeta.type,
      summary,
    });
  }

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
            yHistograms,
          },
        },
        ...(yHistograms && {
          yHistograms,
        }),
        ...(categoryHistograms && {
          categoryHistograms,
        }),
      },
    },
  };
};
