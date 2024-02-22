const generateSubsetFn = (flt) => {
  let subsetFn = (f) => f;
  if (flt.hasOwnProperty("subset")) {
    let subset = flt.subset
      .replace("estimate", "ancestor,descendant")
      .split(",");
    subsetFn = (f) => {
      let sub;
      sub = {
        bool: {
          should: subset.map((s) => ({
            match: { ["attributes.aggregation_source"]: s },
          })),
        },
      };
      return {
        bool: {
          filter: [f, sub],
        },
      };
    };
    delete flt.subset;
  }
  return subsetFn;
};

const wildcard_match = (field, value) => {
  if (value.indexOf("*") != -1) {
    return {
      wildcard: {
        [field]: {
          value,
          boost: 1.0,
          rewrite: "constant_score",
        },
      },
    };
  }
  return {
    match: { [field]: value },
  };
};

export const filterAttributes = (
  filters,
  lookupTypes,
  aggregation_source,
  searchRawValues,
  optionalFields
) => {
  if (Object.keys(filters).length == 0) {
    return [];
  }
  let rangeQuery;
  if (searchRawValues) {
    rangeQuery = (field, stat) => {
      return filters[stat][field].map((flt) => {
        if (typeof flt !== "object") {
          let values = flt.split(",");
          let path = "";
          return {
            nested: {
              path: "attributes.values",
              query: {
                bool: {
                  should: values.map((v) => {
                    let parts = v.split("::");
                    let value = v;
                    if (parts.length > 1) {
                      path = `.${parts.slice(0, parts.length - 1).join(".")}`;
                      value = parts[parts.length - 1];
                    }
                    return {
                      match: { [`attributes.values.${stat}${path}`]: value },
                    };
                  }),
                },
              },
            },
          };
        }
        // TODO: support object-based query here
      });
      let fieldType = lookupTypes(field).type;
      if (fieldType == "keyword") {
        return [
          {
            nested: {
              path: "attributes.values",
              query: {
                match: {
                  [`attributes.values.${lookupTypes(field).type}_value`]:
                    filters[stat][field][0],
                },
              },
            },
          },
        ];
      }
      // TODO: support alternate stats and enum based query here
      return [
        {
          nested: {
            path: "attributes.values",
            query: {
              range: {
                [`attributes.values.${lookupTypes(field).type}_value`]:
                  filters[stat][field],
              },
            },
          },
        },
      ];
    };
  } else {
    rangeQuery = (field, stat) => {
      if (!lookupTypes(field)) {
        return [
          {
            match: { "attributes.key": field },
          },
        ];
      }
      if (
        Array.isArray(filters[stat][field]) &&
        typeof filters[stat][field][0] === "string"
      ) {
        let subsetFn = generateSubsetFn(filters[stat][field]);
        return [
          {
            bool: {
              filter: filters[stat][field].map((term) => {
                let include = [];
                let exclude = [];
                for (let option of term.split(",")) {
                  let parts = option.split("::");
                  let path = "";
                  let value = option;
                  if (parts.length > 1) {
                    path = `.${parts.slice(0, parts.length - 1).join(".")}`;
                    value = parts[parts.length - 1];
                  }
                  if (option.startsWith("!")) {
                    path = path.replace(".!", ".");
                    exclude.push(
                      wildcard_match(`attributes.${stat}${path}`, value)
                    );
                  } else {
                    include.push(
                      wildcard_match(`attributes.${stat}${path}`, value)
                    );
                  }
                }

                return subsetFn({
                  bool: {
                    should: include,
                    must_not: exclude,
                  },
                });
              }),
            },
          },
        ];
      }
      let filter = { ...filters[stat][field] };
      // if (filter.stat) {
      //   stat = filter.stat;
      //   delete filter.stat;
      // }
      let meta = lookupTypes(field);
      if (
        meta.type == "keyword" &&
        meta.summary &&
        meta.summary.includes("enum") &&
        typeof Object.values(filter)[0] === "object"
      ) {
        let list = meta.constraint.enum;
        filter = filter[0];
        const operator = Object.keys(filter)[0];
        const value = Object.values(filter)[0];
        if (Object.keys(filter).length == 1) {
          let terms = [];
          let found = false;
          for (const term of list) {
            if (operator.startsWith("gt") && !found) {
              if (term == value) {
                if (operator.endsWith("e")) {
                  terms.push(term);
                }
                break;
              }
              terms.push(term);
              continue;
            }
            if (term == value) {
              found = true;
              if (operator.endsWith("e")) {
                terms.push(term);
              }
              continue;
            }
            if (found) {
              terms.push(term);
            }
          }
          return [
            {
              bool: {
                should: terms.map((term) => {
                  return {
                    match: { [`attributes.${stat}`]: term },
                  };
                }),
              },
            },
          ];
        } else {
          return [
            {
              match: { [`attributes.${stat}`]: value },
            },
          ];
        }
      }
      if (!Array.isArray(filter)) {
        filter = [filter];
      }
      return filter.map((flt) => {
        let subsetFn = generateSubsetFn(flt);

        if (typeof flt !== "object") {
          let values = flt.split(",");
          return subsetFn({
            bool: {
              should: values.map((value) => ({
                match: { [`attributes.${stat}`]: value },
              })),
            },
          });
        }
        let boolOperator = "should";
        if (flt.hasOwnProperty("ne")) {
          boolOperator = "must_not";
          delete flt.ne;
        }

        if (stat.startsWith("geo_")) {
          return {
            bool: {
              [boolOperator]: subsetFn({
                geo_bounding_box: {
                  [`attributes.${stat}`]: flt,
                },
              }),
            },
          };
        }
        let path = "";
        Object.entries(flt).forEach(([k, v]) => {
          let parts = v.split("::");
          let value = v;
          if (parts.length > 1) {
            path = `.${parts.slice(0, parts.length - 1).join(".")}`;
            value = parts[parts.length - 1];
          }
          flt[k] = value;
        });

        return {
          bool: {
            [boolOperator]: subsetFn({
              range: {
                [`attributes.${stat}${path}`]: flt,
              },
            }),
          },
        };
      });
    };
  }
  if (Object.keys(filters).length == 0) {
    return [];
  }
  let arr = [];
  Object.keys(filters).forEach((stat) => {
    let subset = Object.keys(filters[stat]).map((field) => {
      let filter = {
        filter: [{ match: { "attributes.key": field } }]
          .concat(aggregation_source || [])
          .concat(rangeQuery(field, stat)),
      };
      if (optionalFields.includes(field)) {
        return {
          bool: {
            should: [
              {
                bool: {
                  must_not: [
                    {
                      nested: {
                        path: "attributes",
                        query: {
                          bool: {
                            filter: [{ term: { "attributes.key": field } }],
                          },
                        },
                      },
                    },
                  ],
                },
              },
              {
                nested: {
                  path: "attributes",
                  query: {
                    bool: filter,
                  },
                },
              },
            ],
          },
        };
      }
      return {
        nested: {
          path: "attributes",
          query: {
            bool: filter,
          },
        },
      };
    });
    arr.push(...subset);
  });
  return arr;
};
