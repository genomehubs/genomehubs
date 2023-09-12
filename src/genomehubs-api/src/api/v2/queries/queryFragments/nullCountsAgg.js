// import { client } from "../../functions/connection";
// import { logError } from "../../functions/logger";

export const nullCountsAgg = async ({ fields, names, ranks }) => {
  let fieldFilters = {};
  if (fields.length == 0) {
    return;
  }
  fields.forEach(
    (field) => (fieldFilters[field] = { term: { "attributes.key": field } })
  );
  let aggs = {
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
          },
        },
      },
    },
  };

  return aggs;
};
