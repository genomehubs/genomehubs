import { attrTypes } from "../functions/attrTypes";
import { histogramAgg } from "./histogramAgg";

const termsAgg = async ({ field, result, taxonomy }) => {
  let { lookupTypes } = await attrTypes({ result, taxonomy });
  let meta = lookupTypes(field);
  if (!meta) {
    return;
  }
  return {
    terms: {
      field: `attributes.values.${meta.type}_value`,
    },
  };
};

export const aggregateRawValuesByTaxon = async ({
  lineage,
  field,
  result,
  summary,
  taxonomy,
}) => {
  let histogram, terms;
  if (summary == "histogram") {
    histogram = await histogramAgg({
      field,
      result,
      rawValues: true,
      taxonomy,
    });
  }
  if (summary == "terms") {
    terms = await termsAgg({ field, result, taxonomy });
  }
  return {
    size: 0,
    query: {
      bool: {
        should: [
          {
            match: { taxon_id: lineage },
          },
          {
            nested: {
              path: "lineage",
              query: {
                match: { "lineage.taxon_id": lineage },
              },
            },
          },
        ],
      },
    },
    aggs: {
      attributes: {
        nested: {
          path: "attributes",
        },
        aggs: {
          [field]: {
            filter: {
              bool: {
                filter: [
                  {
                    term: { "attributes.key": field },
                  },
                  {
                    term: { "attributes.aggregation_source": "direct" },
                  },
                ],
              },
            },
            aggs: {
              summary: {
                nested: {
                  path: "attributes.values",
                },
                aggs: {
                  histogram,
                  terms,
                },
              },
            },
          },
        },
      },
    },
  };
};
