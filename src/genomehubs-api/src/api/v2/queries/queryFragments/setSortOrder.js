import { subsets } from "../../functions/subsets";

const ranks = {
  superkingdom: true,
  kingdom: true,
  phylum: true,
  class: true,
  order: true,
  family: true,
  genus: true,
  species: true,
  subspecies: true,
};

const addSortParameter = (sortBy, lookupTypes, lookupNames) => {
  let [by, param = "value"] = sortBy.by.split(":");
  if (
    by == "scientific_name" ||
    by == "taxon_id" ||
    by == "assembly_id" ||
    by == "feature_id"
  ) {
    return {
      [by]: {
        mode: sortBy.mode || "max",
        order: sortBy.order || "asc",
      },
    };
  } else if (ranks[by]) {
    return {
      [`lineage.scientific_name`]: {
        mode: sortBy.mode || "max",
        order: sortBy.order || "asc",
        nested: {
          path: "lineage",
          filter: {
            term: { "lineage.taxon_rank": by },
          },
        },
      },
    };
  } else if (lookupNames(by)) {
    return {
      [`taxon_names.name`]: {
        mode: sortBy.mode || "max",
        order: sortBy.order || "asc",
        nested: {
          path: "taxon_names",
          filter: {
            term: { "taxon_names.class": lookupNames(by).class },
          },
        },
      },
    };
  } else if (lookupTypes(by)) {
    let type =
      param && !subsets.source.has(param)
        ? param
        : `${lookupTypes(by).type || "keyword"}_value`;
    return {
      [`attributes.${type}`]: {
        mode: sortBy.mode || "max",
        order: sortBy.order || "asc",
        nested: {
          path: "attributes",
          filter: {
            term: { "attributes.key": lookupTypes(by).name },
          },
        },
      },
    };
  }
  return {};
};

export const setSortOrder = (sortBys, lookupTypes, lookupNames = () => {}) => {
  if (!sortBys) {
    return [];
  }
  if (!Array.isArray(sortBys)) {
    sortBys = [sortBys];
  }
  let sorts = [];
  for (let sortBy of sortBys) {
    sorts.push(addSortParameter(sortBy, lookupTypes, lookupNames));
  }
  return sorts;
};
