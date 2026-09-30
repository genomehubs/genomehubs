import setSortBy from "../../reports/setSortBy.js";
import { subsets } from "../../functions/subsets.js";

const ranks = {
  domain: true,
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
  if (typeof sortBy === "string") {
    sortBy = setSortBy({ sortBy });
  }
  let [by, param = "value"] = sortBy.by.split(":");
  if (lookupTypes(by)) {
    param = lookupTypes(by).processed_simple;
  }
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
  } else if (lookupNames(by) && lookupNames(by).name) {
    let [name_type, name_class] =
      lookupNames(by).group == "taxon"
        ? ["taxon_names", "name"]
        : ["identifiers", "identifier"];

    return {
      [`${name_type}.${name_class}`]: {
        mode: sortBy.mode || "max",
        order: sortBy.order || "asc",
        nested: {
          path: name_type,
          filter: {
            term: { [`${name_type}.class`]: lookupNames(by).name },
          },
        },
      },
    };
  } else if (lookupTypes(by)) {
    let type =
      param && param != "value" && !subsets.source.has(param)
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
  } else if (by.match(/\./)) {
    let [name, ...parts] = by.split(".");
    let type = `metadata.${parts.join(".")}`;
    return {
      [`attributes.${type}`]: {
        mode: sortBy.mode || "max",
        order: sortBy.order || "asc",
        nested: {
          path: "attributes",
          filter: {
            term: { "attributes.key": lookupTypes(name).name },
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
  if (
    Array.isArray(sortBys) &&
    sortBys.length > 0 &&
    Array.isArray(sortBys[0])
  ) {
    sortBys = sortBys.flat();
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
