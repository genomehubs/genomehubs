export const filterIdentifiers = (identifiers) => {
  return Object.entries(identifiers.keyword_value)
    .map(([key, terms]) => {
      let include = [];
      let exclude = [];
      for (let term of terms) {
        for (let option of term.split(",")) {
          if (option.startsWith("!")) {
            option = option.replace("!", "");
            exclude.push({
              match: { [key]: option },
            });
          } else {
            include.push({
              match: { [key]: option },
            });
          }
        }
      }
      return {
        bool: {
          should: include,
          must_not: exclude,
        },
      };
    })
    .flat();
};
