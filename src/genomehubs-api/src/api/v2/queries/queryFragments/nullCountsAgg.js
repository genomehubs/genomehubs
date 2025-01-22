export const nullCountsAgg = async ({
  fields,
  non_attr_fields,
  names,
  ranks,
  termsCount = 64,
}) => {
  let fieldFilters = {};
  if (fields.length == 0) {
    return;
  }
  fields.forEach(
    (field) => (fieldFilters[field] = { term: { "attributes.key": field } })
  );
  let metaTerms = {};
  if (non_attr_fields && non_attr_fields.length > 0) {
    for (let field of non_attr_fields) {
      if (!field.match(/\w\.\w/)) {
        continue;
      }
      let [key, ...summary] = field.split(".");
      let aggName = `${key}_metadata`;
      if (!metaTerms[aggName]) {
        metaTerms[aggName] = {
          filter: {
            term: { "attributes.key": key },
          },
          aggs: {},
        };
      }
      summary = `metadata.${summary.join(".")}`;
      metaTerms[aggName].aggs[field] = {
        terms: { field: `attributes.${summary}`, size: termsCount },
      };
    }
  }

  return {
    fields: {
      nested: {
        path: "attributes",
      },
      aggs: {
        by_key: {
          filters: { filters: fieldFilters },
          aggs: {
            value_count: {
              value_count: { field: "attributes.key" },
            },
            value_list: {
              terms: { field: "attributes.keyword_value", size: termsCount },
            },
            long_sum: {
              sum: { field: "attributes.long_value" },
            },
            integer_sum: {
              sum: { field: "attributes.integer_value" },
            },
            short_sum: {
              sum: { field: "attributes.short_value" },
            },
            byte_sum: {
              sum: { field: "attributes.byte_value" },
            },
            float_sum: {
              sum: { field: "attributes.float_value" },
            },
            double_sum: {
              sum: { field: "attributes.double_value" },
            },
          },
        },
        ...(Object.keys(metaTerms).length > 0 && {
          ...metaTerms,
        }),
      },
    },
  };
};
