import {
  getHub,
  getNames,
  getRelease,
  getSource,
  getTypes,
  getTypesFetching,
  receiveTypes,
  requestTypes,
} from "#reducers/types";
import {
  getSearchFields,
  getSearchIndex,
  getSearchNameClasses,
  getSearchRanks,
} from "#reducers/search";

import TrieSearch from "trie-search";
import { apiUrl } from "#reducers/api";
import { createCachedSelector } from "re-reselect";
import { createSelector } from "reselect";
import { setApiStatus } from "#reducers/api";
import store from "#store";

export const getTypesMap = createSelector(
  getTypes,
  getSearchIndex,
  (types, index) => {
    if (!types[index]) return {};
    return types[index];
  },
);

export const getSynonyms = createSelector(getTypesMap, (types) => {
  let synonyms = {};
  for (let [field, meta] of Object.entries(types)) {
    if (meta.synonyms) {
      for (let synonym of meta.synonyms) {
        if (synonym != field) {
          synonyms[synonym] = field;
        }
      }
    }
    if (field.match("_")) {
      synonyms[field.replace(/_/g, "-")] = field;
    }
  }
  return synonyms;
});

export const getVersion = createSelector(
  getHub,
  getRelease,
  getSource,
  (hub, release, source) => {
    if (!hub) return {};
    return { hub, release, source };
  },
);

export const getActiveTypes = createSelector(
  getTypesMap,
  getSearchFields,
  (types, searchFields) => {
    let activeTypes = {};
    if (searchFields.length > 0) {
      searchFields.forEach((key) => {
        if (types[key]) {
          activeTypes[key] = true;
        }
      });
    } else {
      Object.keys(types).forEach((key) => {
        let type = types[key];
        if (type.display_level == 1) {
          activeTypes[key] = true;
        }
      });
    }
    return activeTypes;
  },
);

export const taxonomyRanks = {
  subspecies: {
    name: "subspecies",
    display_name: "Subspecies",
    display_group: "ranks",
  },
  species: {
    name: "species",
    display_name: "Species",
    display_group: "ranks",
  },
  genus: { name: "genus", display_name: "Genus", display_group: "ranks" },
  family: {
    name: "family",
    display_name: "Family",
    display_group: "ranks",
    display_level: 1,
  },
  order: {
    name: "order",
    display_name: "Order",
    display_group: "ranks",
    display_level: 1,
  },
  class: { name: "class", display_name: "Class", display_group: "ranks" },
  phylum: {
    name: "phylum",
    display_name: "Phylum",
    display_group: "ranks",
    display_level: 1,
  },
  kingdom: {
    name: "kingdom",
    display_name: "Kingdom",
    display_group: "ranks",
  },
  domain: {
    name: "domain",
    display_name: "Domain",
    display_group: "ranks",
  },
};

export const getActiveRanks = createSelector(getSearchRanks, (searchRanks) => {
  let activeRanks = {};
  if (searchRanks.length > 0) {
    searchRanks.forEach((key) => {
      activeRanks[key] = true;
    });
    // } else {
    //   Object.keys(taxonomyRanks).forEach((key) => {
    //     let rank = taxonomyRanks[key];
    //     if (rank.display_level == 1) {
    //       activeRanks[key] = true;
    //     }
    //   });
  }
  return activeRanks;
});

// export const nameClasses = {
//   "tol id": {
//     name: "tol id",
//     display_name: "Tol ID",
//     display_group: "names",
//   },
//   "wikidata entity": {
//     name: "wikidata entity",
//     display_name: "Wikidata Entity",
//     display_group: "names",
//   },
// };

export const getNamesMap = createSelector(
  getNames,
  getSearchIndex,
  (types, index) => {
    if (!types[index]) return {};
    return types[index];
  },
);

export const getAttributeTrie = createSelector(getTypesMap, (types) => {
  const trie = new TrieSearch("name", {
    splitOnRegEx: false,
    idFieldOrFunction: (item, i) => i,
  });
  trie.addFromObject(types);
  return trie;
});

export const getKeywordTrie = createSelector(getTypesMap, (types) => {
  const trie = new TrieSearch("name", {
    splitOnRegEx: false,
    idFieldOrFunction: (item, i) => i,
  });
  let filteredTypes = Object.entries(types)
    .filter(([key, obj]) => obj.type && obj.type == "keyword")
    .reduce((r, [key, obj]) => ({ ...r, [key]: obj }), {});
  trie.addFromObject(filteredTypes);
  return trie;
});

export const getOperatorTrie = createSelector(getTypesMap, (types) => {
  const operators = [
    {
      display_name: "boolean AND",
      synonym: "and",
      key: "AND",
      wildcard: "*",
    },
    {
      display_name: "less than",
      synonym: "lt",
      key: "<",
      wildcard: "*",
    },
    {
      display_name: "less than or equal to",
      synonym: "lte",
      key: "<=",
      wildcard: "*",
    },
    {
      display_name: "equal to",
      synonym: "eq",
      key: "=",
      wildcard: "*",
    },
    {
      display_name: "not equal to",
      synonym: "ne",
      key: "!=",
      wildcard: "*",
    },
    {
      display_name: "greater than or equal to",
      synonym: "gte",
      key: ">=",
      wildcard: "*",
    },
    {
      display_name: "greater than",
      synonym: "gt",
      key: ">",
      wildcard: "*",
    },
  ];

  const trie = new TrieSearch(["display_name", "key", "synonym", "wildcard"], {
    idFieldOrFunction: "key",
  });
  trie.addAll(operators);
  return trie;
});

export const getRankTrie = createSelector(getTypesMap, (types) => {
  let ranks = [
    "subspecies",
    "species",
    "genus",
    "family",
    "class",
    "order",
    "phylum",
    "domain",
  ];
  let otherRanks = [
    "biotype",
    "clade",
    "cohort",
    "forma",
    "forma specialis",
    "genotype",
    "infraclass",
    "infraorder",
    "isolate",
    "kingdom",
    "morph",
    "no rank",
    "parvorder",
    "pathogroup",
    "section",
    "series",
    "serogroup",
    "serotype",
    "species group",
    "species subgroup",
    "strain",
    "subclass",
    "subcohort",
    "subfamily",
    "subgenus",
    "subkingdom",
    "suborder",
    "subphylum",
    "subsection",
    "subtribe",
    "superclass",
    "superfamily",
    "superorder",
    "superphylum",
    "tribe",
    "varietas",
  ];
  const trie = new TrieSearch(["display_name", "key", "wildcard"], {
    idFieldOrFunction: "key",
  });
  trie.addAll(
    ranks
      .map((key) => ({ key, display_name: key, wildcard: "*" }))
      .concat(otherRanks.map((key) => ({ key, display_name: key }))),
  );
  return trie;
});

export const getTaxTrie = createSelector(getTypesMap, (types) => {
  const values = [
    {
      display_name: "taxon name",
      synonym: "tax_eq",
      key: "tax_name",
      after: "(",
      group: "taxon",
      type: "operator",
    },
    {
      display_name: "taxon tree",
      key: "tax_tree",
      after: "(",
      group: "taxon",
      type: "operator",
    },
    {
      display_name: "taxon rank",
      key: "tax_rank",
      after: "(",
      group: "taxon",
      type: "operator",
    },
    {
      display_name: "taxon lineage",
      key: "tax_lineage",
      after: "(",
      group: "taxon",
      type: "operator",
    },
  ];
  const trie = new TrieSearch(["display_name", "key"], {
    idFieldOrFunction: "key",
  });
  trie.addAll(values);
  return trie;
});

export const getSummaryTrie = createSelector(getTypesMap, (types) => {
  const values = [
    {
      display_name: "maximum value",
      key: "max",
      after: "(",
      group: "summary",
      type: "operator",
    },
    {
      display_name: "minimum value",
      key: "min",
      after: "(",
      group: "summary",
      type: "operator",
    },
    {
      display_name: "range of values",
      key: "range",
      after: "(",
      group: "summary",
      type: "operator",
    },
    {
      display_name: "list length",
      key: "length",
      after: "(",
      group: "summary",
      type: "operator",
    },
  ];
  const trie = new TrieSearch(["display_name", "key"], {
    idFieldOrFunction: "key",
  });
  trie.addAll(values);
  return trie;
});

const processValueTrie = (types, key) => {
  if (!types) {
    return;
  }
  let meta = types[key] || {};
  if (meta.type != "keyword") {
    return;
  }
  if (meta.constraint && meta.constraint.enum) {
    let lookup = {};
    if (meta.translate) {
      for (let [from, to] of Object.entries(meta.translate)) {
        lookup[to] = from;
      }
    }
    let values = meta.constraint.enum.map((key) => ({
      display_name: lookup[key] || key,
      key,
      synonym: lookup[key],
      wildcard: "*",
    }));
    const trie = new TrieSearch(
      ["display_name", "key", "synonym", "wildcard"],
      {
        idFieldOrFunction: "key",
      },
    );
    trie.addAll(values);
    return trie;
  }
  return;
};

export const getValueTrie = createCachedSelector(
  getTypesMap,
  (_state, key) => key,
  (types, key) => {
    return processValueTrie(types, key);
  },
)((_state, key) => key);

export const getActiveNameClasses = createSelector(
  getNamesMap,
  getSearchNameClasses,
  (nameClasses, searchNames) => {
    let activeNameClasses = {};
    if (searchNames.length > 0) {
      searchNames.forEach((key) => {
        if (nameClasses[key]) {
          activeNameClasses[key] = true;
        }
      });
    } else {
      Object.keys(nameClasses).forEach((key) => {
        let nameClass = nameClasses[key];
        if (nameClass.display_level == 1) {
          activeNameClasses[key] = true;
        }
      });
    }
    return activeNameClasses;
  },
);

export const getDisplayTypes = createSelector(
  getTypesMap,
  getActiveTypes,
  (types, activeTypes) => {
    let displayTypes = [];
    Object.keys(types).forEach((key) => {
      if (activeTypes[key]) {
        displayTypes.push(types[key]);
      }
    });
    return displayTypes.sort((a, b) => a.sequence - b.sequence);
  },
);

export const getGroupedTypes = createSelector(
  getTypesMap,
  getNamesMap,
  getActiveTypes,
  getActiveRanks,
  getActiveNameClasses,
  (types, nameClasses, activeTypes, activeRanks, activeNameClasses) => {
    let groupedTypes = {};
    Object.keys(types).forEach((key) => {
      let type = types[key];
      let group = type.display_group;
      if (!groupedTypes[group]) {
        groupedTypes[group] = {};
      }
      groupedTypes[group][key] = { ...type };
      if (activeTypes[key]) {
        groupedTypes[group][key].active = true;
      }
    });
    groupedTypes.ranks = {};
    Object.keys(taxonomyRanks).forEach((rank) => {
      groupedTypes.ranks[rank] = { ...taxonomyRanks[rank] };
      if (activeRanks[rank]) {
        groupedTypes.ranks[rank].active = true;
      }
    });
    groupedTypes.names = {};
    Object.keys(nameClasses).forEach((nameClass) => {
      groupedTypes.names[nameClass] = { ...nameClasses[nameClass] };
      if (activeNameClasses[nameClass]) {
        groupedTypes.names[nameClass].active = true;
      }
    });
    return groupedTypes;
  },
);

export function fetchTypes(result, taxonomy) {
  return async function (dispatch) {
    const state = store.getState();
    const types = getTypes(state);
    if (types[result]) {
      return;
    }
    const fetching = getTypesFetching(state);
    if (fetching) {
      return;
    }
    dispatch(requestTypes(result));
    let url = `${apiUrl}/resultFields?result=${result}&taxonomy=${encodeURIComponent(
      taxonomy,
    )}`;
    try {
      let json;
      try {
        const response = await fetch(url);
        json = await response.json();
      } catch (error) {
        json = console.log("An error occured.", error);
      }
      json.index = result;
      dispatch(receiveTypes(json));
      if (json && Object.keys(json.fields).length > 0) {
        dispatch(setApiStatus(true));
      } else {
        dispatch(setApiStatus(false));
      }
    } catch (err) {
      return dispatch(setApiStatus(false));
    }
  };
}
