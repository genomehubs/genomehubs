const analysisLookupQuery = ({ searchTerm }) => {
  return {
    bool: {
      should: [
        {
          match: { analysis_id: searchTerm },
        },
        {
          prefix: {
            analysis_id: {
              value: searchTerm,
            },
          },
        },
      ],
    },
  };
};

const assemblyLookupQuery = ({ searchTerm }) => {
  return {
    bool: {
      should: [
        {
          match: { assembly_id: searchTerm },
        },
        {
          nested: {
            path: "identifiers",
            query: {
              prefix: {
                ["identifiers.identifier"]: {
                  value: searchTerm,
                },
              },
            },
            inner_hits: {
              _source: false,
              docvalue_fields: [
                {
                  field: "identifiers.identifier.raw",
                  format: "use_field_mapping",
                },
                {
                  field: "identifiers.class",
                  format: "use_field_mapping",
                },
              ],
            },
          },
        },
      ],
    },
  };
};

const taxonLookupQuery = ({ searchTerm, lineage, size }) => {
  let query = {
    bool: {
      should: [
        {
          match: { taxon_id: searchTerm },
        },
        {
          nested: {
            path: "taxon_names",
            query: {
              match_phrase_prefix: {
                ["taxon_names.name"]: {
                  query: searchTerm,
                  max_expansions: size,
                },
              },
            },
            inner_hits: {
              _source: false,
              docvalue_fields: [
                {
                  field: "taxon_names.name.raw",
                  format: "use_field_mapping",
                },
                {
                  field: "taxon_names.class",
                  format: "use_field_mapping",
                },
              ],
            },
          },
        },
      ],
    },
  };
  if (lineage) {
    query = {
      bool: {
        must: [
          {
            nested: {
              path: lineage,
              query: {
                multi_match: {
                  query: lineage,
                  fields: ["lineage.taxon_id", "lineage.scientific_name"],
                },
              },
            },
          },
          query,
        ],
      },
    };
  }
  return query;
};

export const lookupQuery = ({ result, searchTerm, lineage, size = 10 }) => {
  let query = {};
  let _source = [];
  if (result == "analysis") {
    query = analysisLookupQuery({ searchTerm });
    _source = ["analysis_id", "assembly_id", "taxon_id"];
  } else if (result == "assembly") {
    query = assemblyLookupQuery({ searchTerm });
    _source = ["assembly_id", "taxon_id", "scientific_name", "identifiers.*"];
  } else if (result == "taxon") {
    query = taxonLookupQuery({ searchTerm, lineage, size });
    _source = [
      "taxon_id",
      "scientific_name",
      "taxon_rank",
      "taxon_names.*",
      "lineage.*",
    ];
  }
  return {
    size,
    query,
    _source,
  };
};
