export const setIncludes = ({
  result,
  summaryValues,
  non_attr_fields,
  includeRawValues,
}) => {
  let include = [];
  if (result == "taxon" || result == "assembly" || result == "sample") {
    include = include
      .concat(["taxon_id", "scientific_name", "taxon_rank", "parent"])
      .concat(
        summaryValues ? summaryValues.map((key) => `attributes.${key}`) : []
      );
    if (result == "assembly") {
      include.push("assembly_id");
    }
    if (result == "sample") {
      include.push("sample_id");
    }
  }
  if (result == "feature") {
    include = include
      .concat(["taxon_id", "assembly_id", "feature_id", "primary_type"])
      .concat(
        summaryValues ? summaryValues.map((key) => `attributes.${key}`) : []
      );
  }
  if (non_attr_fields && non_attr_fields.length > 0) {
    include = include.concat(non_attr_fields);
  }

  if (includeRawValues) {
    include.push("attributes.*");
  }
  return include;
};
