export const setAggregationSource = (result, includeEstimates) => {
  let aggregation_source = [];
  if (result == "taxon") {
    if (!includeEstimates) {
      // if (!includeEstimates || includeEstimates !== true) {
      aggregation_source = [
        {
          bool: {
            should: [
              { match: { "attributes.aggregation_source": "direct" } },
              // { match: { "attributes.aggregation_source": "descendant" } },
            ],
          },
        },
        // { match: { "attributes.aggregation_source": "direct" } },
        { exists: { field: "attributes.aggregation_method" } },
      ];
    } else if (includeEstimates !== true) {
      aggregation_source = [
        { match: { "attributes.aggregation_source": "direct" } },
        { match: { "attributes.aggregation_source": "descendant" } },
        { exists: { field: "attributes.aggregation_method" } },
      ];
    } else {
      aggregation_source = [
        { exists: { field: "attributes.aggregation_source" } },
        { exists: { field: "attributes.aggregation_method" } },
      ];
    }
  }
  return aggregation_source;
};
