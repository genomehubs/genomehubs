export const matchIdentifiers = (names = {}, namesMap) => {
  let nameClasses = Object.keys(names);
  if (nameClasses.length == 0) return [];
  return [
    {
      bool: {
        should: [
          {
            nested: {
              path: "identifiers",
              query: {
                bool: {
                  should: nameClasses.map((nameClass) => ({
                    bool: {
                      filter: { match: { "identifiers.class": nameClass } },
                    },
                  })),
                },
              },
              inner_hits: {
                _source: false,
                docvalue_fields: [
                  "identifiers.class",
                  "identifiers.identifier.raw",
                  "identifiers.source",
                  "identifiers.source_url_stub",
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
