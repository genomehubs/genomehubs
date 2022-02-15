export const setIncludes = ({
  result,
  summaryValues,
  non_attr_fields,
  includeRawValues,
}) => {
  let include = [];
  if (result == "taxon" || result == "assembly") {
    include = include
      .concat(["taxon_id", "scientific_name", "taxon_rank", "parent"])
      .concat(
        summaryValues ? summaryValues.map((key) => `attributes.${key}`) : []
      );
    if (result == "assembly") {
      include.push("assembly_id");
    }
  }
  if (non_attr_fields && non_attr_fields.length > 0) {
    include = include.concat(non_attr_fields);
  }

  if (includeRawValues) {
    include.push("attributes.*");
  }
  return include;
};
