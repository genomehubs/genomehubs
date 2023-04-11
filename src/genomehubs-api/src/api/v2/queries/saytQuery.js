const analysisSaytQuery = ({ searchTerm }) => {
  return {
    bool: {
      should: [
        {
          match: { analysis_id: "{{searchTerm}}" },
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

const identifiersSaytQuery = ({ idKey, searchTerm }) => {
  return {
    bool: {
      should: [
        {
          prefix: {
            [idKey]: {
              value: searchTerm,
              boost: 10,
            },
          },
        },
        {
          match_phrase_prefix: {
            [`${idKey}.text`]: {
              query: searchTerm,
              boost: 5,
            },
          },
        },
        {
          multi_match: {
            query: searchTerm,
            type: "phrase_prefix",
            boost: 2,
            fields: [
              `${idKey}.live`,
              `${idKey}.live._2gram`,
              `${idKey}.live._3gram`,
            ],
          },
        },
        {
          nested: {
            path: "identifiers",
            query: {
              bool: {
                must: {
                  multi_match: {
                    query: searchTerm,
                    type: "phrase_prefix",
                    boost: 1.0,
                    fields: [
                      "identifiers.identifier.live",
                      "identifiers.identifier.live._2gram",
                      "identifiers.identifier.live._3gram",
                    ],
                  },
                },
              },
            },
            inner_hits: {
              _source: false,
              docvalue_fields: [
                "identifiers.identifier.raw",
                "identifiers.source",
                "identifiers.class",
                // {
                //   field: "identifiers.identifier.raw.keyword",
                //   format: "use_field_mapping",
                // },
                // {
                //   field: "identifiers.source",
                //   format: "use_field_mapping",
                // },
                // {
                //   field: "identifiers.class",
                //   format: "use_field_mapping",
                // },
              ],
            },
          },
        },
      ],
    },
  };
};

const assemblySaytQuery = ({ searchTerm }) =>
  identifiersSaytQuery({ idKey: "assembly_id", searchTerm });

const featureSaytQuery = ({ searchTerm }) =>
  identifiersSaytQuery({ idKey: "feature_id", searchTerm });

const sampleSaytQuery = ({ searchTerm }) =>
  identifiersSaytQuery({ idKey: "sample_id", searchTerm });

const taxonSaytQuery = ({ searchTerm, wildcardTerm = "", size }) => {
  return {
    bool: {
      should: [
        {
          match: {
            scientific_name: {
              query: searchTerm,
              boost: 100,
            },
          },
        },
        {
          match: {
            taxon_id: {
              query: searchTerm,
              boost: 100,
            },
          },
        },
        {
          prefix: {
            scientific_name: {
              value: searchTerm,
              boost: 50,
            },
          },
        },
        {
          wildcard: {
            scientific_name: {
              value: wildcardTerm,
              boost: 50,
            },
          },
        },
        {
          match_phrase_prefix: {
            ["scientific_name.text"]: {
              query: searchTerm,
              max_expansions: size,
              boost: 5,
            },
          },
        },
        {
          multi_match: {
            query: searchTerm,
            type: "phrase_prefix",
            boost: 2,
            fields: [
              "scientific_name.live",
              "scientific_name.live._2gram",
              "scientific_name.live._3gram",
            ],
          },
        },
        {
          nested: {
            path: "taxon_names",
            query: {
              bool: {
                must: {
                  bool: {
                    should: [
                      {
                        match: {
                          ["taxon_names.name"]: {
                            query: searchTerm,
                            boost: 2.0,
                          },
                        },
                      },
                      {
                        multi_match: {
                          query: searchTerm,
                          type: "phrase_prefix",
                          boost: 1.0,
                          fields: [
                            "taxon_names.name.live",
                            "taxon_names.name.live._2gram",
                            "taxon_names.name.live._3gram",
                          ],
                        },
                      },
                      {
                        bool: {
                          must: [
                            {
                              multi_match: {
                                query: searchTerm,
                                type: "phrase_prefix",
                                boost: 2,
                                fields: [
                                  "taxon_names.name.live",
                                  "taxon_names.name.live._2gram",
                                  "taxon_names.name.live._3gram",
                                ],
                              },
                            },
                            {
                              match: {
                                ["taxon_names.class"]: {
                                  query: "scientific name",
                                  boost: 2,
                                },
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                must_not: {
                  match: { ["taxon_names.class"]: "authority" },
                },
              },
            },
            inner_hits: {
              _source: false,
              docvalue_fields: [
                "taxon_names.name.raw",
                "taxon_names.class",
                // {
                //   field: "taxon_names.name.raw.keyword",
                //   format: "use_field_mapping",
                // },
                // {
                //   field: "taxon_names.class.keyword",
                //   format: "use_field_mapping",
                // },
              ],
            },
          },
        },
      ],
    },
  };
};

export const saytQuery = ({ result, searchTerm, wildcardTerm, size = 10 }) => {
  let query = {};
  let _source = [];
  let sort;
  if (result == "analysis") {
    query = analysisSaytQuery({ searchTerm });
    _source = ["analysis_id", "assembly_id", "taxon_id"];
  } else if (result == "assembly") {
    query = assemblySaytQuery({ searchTerm });
    _source = ["assembly_id", "taxon_id", "scientific_name", "identifiers.*"];
  } else if (result == "sample") {
    query = sampleSaytQuery({ searchTerm });
    _source = [
      "sample_id",
      "assembly_id",
      "taxon_id",
      "scientific_name",
      "identifiers.*",
    ];
  } else if (result == "feature") {
    query = featureSaytQuery({ searchTerm });
    _source = [
      "assembly_id",
      "taxon_id",
      "feature_id",
      "primary_type",
      "identifiers.*",
    ];
  } else if (result == "taxon") {
    query = taxonSaytQuery({ searchTerm, wildcardTerm, size });
    _source = ["taxon_id", "scientific_name", "taxon_rank", "taxon_names.*"];
    sort = [
      {
        _score: { order: "desc" },
      },
      {
        _script: {
          script: "doc['scientific_name'].value.length()",
          type: "number",
          order: "asc",
        },
      },
      {
        scientific_name: { order: "asc" },
      },
    ];
  }
  return {
    size,
    query,
    sort,
    _source,
  };
};
