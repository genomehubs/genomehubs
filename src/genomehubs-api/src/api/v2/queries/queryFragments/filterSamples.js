export const filterSamples = (searchTerm, multiTerm, idTerm) => {
  if (multiTerm && multiTerm > "") {
    return [
      {
        bool: {
          should: multiTerm.map((term) => {
            if (term.match(/\*/)) {
              return {
                bool: {
                  should: [
                    {
                      wildcard: { sample_id: term },
                    },
                    {
                      nested: {
                        path: "identifiers",
                        query: {
                          wildcard: {
                            "identifiers.identifier": term,
                          },
                        },
                      },
                    },
                  ],
                },
              };
            }
            return {
              bool: {
                should: [
                  {
                    match: { sample_id: term },
                  },
                  {
                    nested: {
                      path: "identifiers",
                      query: {
                        match: {
                          "identifiers.identifier": term,
                        },
                      },
                    },
                  },
                ],
              },
            };
          }),
        },
      },
    ];
  }
  if (idTerm && idTerm > "") {
    return [
      {
        bool: {
          should: [
            {
              match: { sample_id: idTerm },
            },
            {
              nested: {
                path: "identifiers",
                query: {
                  match: {
                    "identifiers.identifier": idTerm,
                  },
                },
              },
            },
          ],
        },
      },
    ];
  }
  return [];
};
