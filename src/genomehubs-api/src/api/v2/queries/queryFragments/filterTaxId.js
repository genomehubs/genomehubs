export const filterTaxId = (searchTerm) => {
  if (searchTerm && searchTerm > "") {
    return [
      {
        bool: {
          should: [
            {
              match: { taxon_id: searchTerm },
            },
          ],
        },
      },
    ];
  }
  return [];
};
