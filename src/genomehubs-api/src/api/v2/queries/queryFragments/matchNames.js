export const matchNames = (names = {}, namesMap) => {
  let nameClasses = Object.keys(names);
  if (nameClasses.length == 0) return [];
  return [
    {
      bool: {
        should: [
          {
            nested: {
              path: "taxon_names",
              query: {
                bool: {
                  should: nameClasses.map((nameClass) => ({
                    bool: {
                      filter: { match: { "taxon_names.class": nameClass } },
                    },
                  })),
                },
              },
              inner_hits: {
                _source: false,
                docvalue_fields: [
                  "taxon_names.class",
                  "taxon_names.name.raw",
                  "taxon_names.source",
                  "taxon_names.source_url_stub",
                ],
                size: 100,
              },
            },
          },
          { match_all: {} },
        ],
      },
    },
  ];
};
