// TODO: don't fetch raw value if not wanted
export const matchAttributes = ({
  fields,
  attr_summaries,
  lookupTypes,
  aggregation_source,
  searchRawValues,
  name = "attributes",
}) => {
  if (fields.length == 0) return [];
  let docValues = [];
  for (let field of fields) {
    let meta = lookupTypes(field);
    if (!meta) {
      continue;
    }
    for (let summary of attr_summaries[field] || ["default"]) {
      let value;
      if (summary == "default") {
        value = `attributes.${meta.processed_summary}`;
      } else if (summary == "value") {
        value = `attributes.${meta.type}_value`;
      } else {
        value = `attributes.${summary}`;
      }
      value = value.replace(/keyword_value$/, "keyword_value.raw");
      docValues.push(value);
    }
  }
  docValues = [...new Set(docValues)];
  return [
    {
      bool: {
        should: [
          {
            bool: {
              filter: {
                nested: {
                  path: "attributes",
                  query: {
                    bool: {
                      should: fields
                        .filter((field) => lookupTypes(field))
                        .map((field) => ({
                          bool: {
                            filter: [
                              { match: { "attributes.key": field } },
                              {
                                exists: {
                                  field: `attributes.${
                                    lookupTypes(field).type
                                  }_value`,
                                },
                              },
                            ].concat(aggregation_source),
                          },
                        })),
                    },
                  },
                },
              },
            },
          },
          {
            bool: {
              should: {
                nested: {
                  path: "attributes",
                  query: {
                    bool: {
                      should: fields.map((field) => ({
                        bool: {
                          filter: [{ match: { "attributes.key": field } }],
                        },
                      })),
                    },
                  },
                  inner_hits: {
                    _source: false,
                    name,
                    docvalue_fields: [
                      "attributes.key",
                      "attributes.is_primary_value",
                      "attributes.count",
                      "attributes.max",
                      "attributes.min",
                      "attributes.mean",
                      "attributes.median",
                      "attributes.mode",
                      "attributes.sum",
                      "attributes.from",
                      "attributes.to",
                      "attributes.range",
                      "attributes.length",
                      "attributes.aggregation_method",
                      "attributes.aggregation_source",
                      "attributes.aggregation_rank",
                      "attributes.aggregation_taxon_id",
                    ]
                      .concat(docValues)
                      .concat(
                        searchRawValues
                          ? [
                              "attributes.keyword_value.raw",
                              "attributes.date_value",
                              "attributes.geo_point_value",
                              "attributes.long_value",
                              "attributes.integer_value",
                              "attributes.short_value",
                              "attributes.byte_value",
                              "attributes.double_value",
                              "attributes.float_value",
                              "attributes.half_float_value",
                              "attributes.1dp_value",
                              "attributes.2dp_value",
                              "attributes.3dp_value",
                              "attributes.4dp_value",
                              "attributes.values.source",
                            ]
                          : []
                      ),
                    size: 100,
                  },
                },
              },
            },
          },
        ],
        minimum_should_match: 2,
      },
    },
  ];
};
