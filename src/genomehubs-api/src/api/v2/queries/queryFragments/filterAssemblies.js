export const filterAssemblies = (searchTerm, multiTerm, idTerm) => {
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
                      wildcard: { assembly_id: term },
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
                    match: { assembly_id: term },
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
              match: { assembly_id: idTerm },
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
