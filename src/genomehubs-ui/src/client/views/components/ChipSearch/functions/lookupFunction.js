const taxon_lookup = (lookupTerm, result, taxonomy, apiUrl) => {
  let searchTerm = lookupTerm.replace(/\[.*/, "").replace(/_/g, " ");
  let negate = false;
  if (searchTerm.startsWith("!")) {
    searchTerm = searchTerm.slice(1);
    negate = true;
  }
  let options = {
    searchTerm,
    result,
    taxonomy,
  };

  const formatResults = (json) => {
    if (!json) {
      return [];
    }
    if (json.results && json.results.length > 0) {
      return json.results.map((obj, id) => {
        let { taxon_rank, taxon_id, scientific_name } = obj.result;
        let option = { taxon_rank, id };
        if (obj.reason && obj.reason.length > 0) {
          Object.entries(obj.reason[0].fields).forEach(([key, value]) => {
            if (key.endsWith("class")) {
              option.class = value[0];
              option.name_class = value[0];
            } else if (key.endsWith("raw")) {
              option.value = value[0];
            }
          });
          option.match = "partial";
        } else {
          option.value = options.searchTerm;
          if (taxon_id == options.searchTerm) {
            option.class = "taxon_id";
            option.name_class = "scientific name";
            option.value = scientific_name;
            option.match = "exact";
          } else if (scientific_name == options.searchTerm) {
            option.class = "scientific_name";
            option.name_class = "scientific name";
            option.match = "exact";
          } else {
            for (let [key, value] of Object.entries(
              obj.result.taxon_names || {},
            )) {
              if (value.toLowerCase() === options.searchTerm.toLowerCase()) {
                option.class = key;
                option.name_class = key.replace(/_/g, " ");
                option.match = "exact";
                option.value = value;
                break;
              }
            }
          }
        }
        option.taxon_id = taxon_id;
        option.scientific_name = scientific_name;
        option.result = result;
        option.title = scientific_name;
        if (negate) {
          option.negate = true;
        }
        return option;
      });
    }
  };

  let url = `${apiUrl}/lookup?searchTerm=${options.searchTerm}&result=${options.result}&taxonomy=${options.taxonomy}`;
  return fetch(url)
    .then(
      (response) => response.json(),
      (error) => console.log("An error occured.", error),
    )
    .then((json) => {
      return formatResults(json);
    })
    .catch((err) => {
      console.error("Error fetching lookup data:", err);
    });
};

const taxon_rank_lookup = (lookupTerm, result, taxonomy, apiUrl) => {
  const formatResults = (json) => {
    if (!json) {
      return [];
    }
    if (json.ranks && json.ranks.length > 0) {
      let matchedRanks;
      if (lookupTerm.length > 2) {
        matchedRanks = json.ranks
          .filter((rank) =>
            rank.toLowerCase().includes(lookupTerm.toLowerCase()),
          )
          .sort((a, b) => {
            // Sort by how much of the lookupTerm matches (longer match first)
            const aMatchLength = a
              .toLowerCase()
              .startsWith(lookupTerm.toLowerCase())
              ? lookupTerm.length
              : 0;
            const bMatchLength = b
              .toLowerCase()
              .startsWith(lookupTerm.toLowerCase())
              ? lookupTerm.length
              : 0;
            return bMatchLength - aMatchLength || a.length - b.length;
          });
      } else {
        matchedRanks = json.ranks;
      }
      if (matchedRanks.length > 0) {
        return matchedRanks.map((rank) => ({
          value: rank,
          display_value: rank,
          type: "rank",
          result,
          taxonomy,
        }));
      }
      return [];
    }
  };

  const url = `${apiUrl}/taxonomicRanks?result=${result}&taxonomy=${taxonomy}`;

  return fetch(url)
    .then(
      (response) => response.json(),
      (error) => console.log("An error occured.", error),
    )
    .then((json) => {
      return formatResults(json);
    })
    .catch((err) => {
      console.error("Error fetching lookup data:", err);
    });
};

export const lookupFunction = ({
  lookupTerm,
  key,
  modifier,
  apiUrl = "https://goat.genomehubs.org/api/v2",
  result = "taxon",
  taxonomy = "ncbi",
}) => {
  if (key === "tax") {
    if (["eq", "lineage", "name", "tree"].includes(modifier)) {
      return taxon_lookup(lookupTerm, result, taxonomy, apiUrl);
    } else if (modifier === "rank") {
      return taxon_rank_lookup(lookupTerm, result, taxonomy, apiUrl);
    }
  }
};

export default lookupFunction;
