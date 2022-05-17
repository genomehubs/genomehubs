export const excludeSources = (exclusions = {}, fields) => {
  const preserveMultiple = ({ field, source }) => {
    if (source == "direct" && !(exclusions.descendant || []).includes(field)) {
      source = "descendant";
    } else if (
      source == "descendant" &&
      !(exclusions.direct || []).includes(field)
    ) {
      source = "direct";
    } else {
      return [];
    }
    return [
      {
        bool: {
          must_not: {
            match: {
              "attributes.aggregation_source": source,
            },
          },
        },
      },
    ];
  };
  let excluded = [];
  Object.keys(exclusions).forEach((source) => {
    if (source == "unclassified") {
      excluded.push({
        nested: {
          path: "lineage",
          query: {
            prefix: { "lineage.scientific_name": { value: "unclassified" } },
          },
        },
      });
      excluded.push({
        nested: {
          path: "lineage",
          query: {
            prefix: { "lineage.scientific_name": { value: "environmental" } },
          },
        },
      });

      return;
    }

    exclusions[source].forEach((field) => {
      if (source == "missing") {
        delete fields[field];
        excluded.push({
          bool: {
            must_not: {
              nested: {
                path: "attributes",
                query: {
                  match: { "attributes.key": field },
                },
              },
            },
          },
        });
        return;
      }
      excluded.push({
        nested: {
          path: "attributes",
          query: {
            bool: {
              filter: [
                {
                  match: { "attributes.key": field },
                },
                {
                  match: {
                    "attributes.aggregation_source": source,
                  },
                },
              ].concat(preserveMultiple({ field, source })),
            },
          },
        },
      });
    });
  });
  return excluded;
};
