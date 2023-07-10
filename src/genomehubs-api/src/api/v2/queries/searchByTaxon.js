import { attrTypes } from "../functions/attrTypes";
import { collateAttributes } from "./queryFragments/collateAttributes";
import { excludeSources } from "./queryFragments/excludeSources";
import { filterAssemblies } from "./queryFragments/filterAssemblies";
import { filterAttributes } from "./queryFragments/filterAttributes";
import { filterIdentifiers } from "./queryFragments/filterIdentifiers";
import { filterProperties } from "./queryFragments/filterProperties";
import { filterSamples } from "./queryFragments/filterSamples";
import { filterTaxId } from "./queryFragments/filterTaxId";
import { filterTaxa } from "./queryFragments/filterTaxa";
import { matchAttributes } from "./queryFragments/matchAttributes";
import { matchNames } from "./queryFragments/matchNames";
import { matchRanks } from "./queryFragments/matchRanks";
import { restrictToRank } from "./queryFragments/restrictToRank";
import { setAggregationSource } from "./queryFragments/setAggregationSource";
import { setIncludes } from "./queryFragments/setIncludes";
import { setSortOrder } from "./queryFragments/setSortOrder";

export const searchByTaxon = async ({
  searchTerm,
  collateTerm,
  idTerm,
  identifierTerms,
  multiTerm,
  result,
  ancestral,
  fields,
  optionalFields,
  names,
  ranks,
  rank,
  depth,
  maxDepth,
  includeEstimates,
  includeLineage,
  includeRawValues,
  searchRawValues,
  filters,
  properties,
  exclusions,
  summaryValues,
  size,
  offset,
  sortBy,
  function_score,
  taxonomy,
  index,
  aggs = {},
}) => {
  let { typesMap, lookupTypes } = await attrTypes({ result, taxonomy });
  let { typesMap: namesMap, lookupTypes: lookupNames } = await attrTypes({
    result,
    indexType: "identifiers",
    taxonomy,
  });
  let attr_summaries = {};
  fields.forEach((field) => {
    let [name, summary = "default"] = field.split(":");
    if (!attr_summaries[name]) {
      attr_summaries[name] = [];
    }
    attr_summaries[name].push(summary);
  });
  let attr_fields = fields
    .filter((field) => lookupTypes(field))
    .map((field) => lookupTypes(field).name);
  let non_attr_fields = fields.filter((field) => !lookupTypes(field));
  let types = attr_fields.map((field) => typesMap[field]);
  types = [...new Set(types.map((type) => type.type))];
  if (attr_fields.length > 0) {
    fields = attr_fields;
  } else {
    non_attr_fields = fields;
    fields = [];
  }
  let aggregation_source = setAggregationSource(result, includeEstimates);
  let excludedSources = excludeSources(exclusions, fields);
  let attributesExist = matchAttributes(
    fields,
    attr_summaries,
    lookupTypes,
    aggregation_source,
    searchRawValues
  );
  let optionalAttributesExist;
  if (optionalFields) {
    optionalAttributesExist = matchAttributes(
      optionalFields,
      lookupTypes,
      aggregation_source,
      searchRawValues,
      "optionalAttributes"
    );
  }
  let identifiers = [];
  if (identifierTerms) {
    identifiers = filterIdentifiers(identifierTerms);
  }
  let namesExist = matchNames(names, namesMap);
  let lineageRanks = matchRanks(ranks, maxDepth);
  let attributeValues = filterAttributes(
    filters,
    lookupTypes,
    aggregation_source,
    searchRawValues,
    optionalFields
  );
  let propertyValues = filterProperties(properties);
  let assemblyFilter = [];
  let sampleFilter = [];
  let taxonFilter = [];
  if (result == "taxon" || result == "assembly" || result == "sample") {
    if (result == "assembly") {
      assemblyFilter = filterAssemblies(searchTerm, multiTerm, idTerm);
    }
    if (result == "sample") {
      sampleFilter = filterSamples(searchTerm, multiTerm, idTerm);
    }
    if (result == "taxon" && Object.keys(aggs).length == 0) {
      if (!searchTerm && (rank || depth || maxDepth)) {
        searchTerm = idTerm;
        ancestral = true;
        idTerm = undefined;
      }
    } else {
      idTerm = undefined;
    }
    if (searchTerm && searchTerm.match(",")) {
      let taxFilter = [];
      let notTaxFilter = [];
      let boolOperator = "should";
      searchTerm.split(/\s*,\s*/).forEach((taxon) => {
        if ((taxon || "").startsWith("!")) {
          taxon = taxon.replace("!", "");
          boolOperator = "must_not";
        }
        let subFilter = filterTaxa({
          depth,
          searchTerm: taxon,
          multiTerm,
          ancestral,
          idTerm,
          gte: maxDepth ? undefined : true,
        });
        if (boolOperator == "should") {
          taxFilter = taxFilter.concat(subFilter);
        } else {
          notTaxFilter = notTaxFilter.concat(subFilter);
        }
      });
      taxonFilter = [{ bool: { should: taxFilter, must_not: notTaxFilter } }];
    } else {
      let boolOperator = "should";
      let taxon = searchTerm;
      if ((taxon || "").startsWith("!")) {
        taxon = taxon.replace("!", "");
        boolOperator = "must_not";
      }
      taxonFilter = filterTaxa({
        depth,
        searchTerm: taxon,
        multiTerm,
        ancestral,
        idTerm,
        gte: maxDepth ? undefined : true,
      });
      taxonFilter = [{ bool: { [boolOperator]: taxonFilter } }];
    }
  } else {
    // TODO: allow comma separated taxa here
    taxonFilter = filterTaxId(searchTerm);
  }
  let rankRestriction;
  if (rank && rank.match(",")) {
    let rankFilter = [];
    rank.split(/\s*,\s*/).forEach((r) => {
      rankFilter = rankFilter.concat(restrictToRank(r));
    });
    rankRestriction = [{ bool: { should: rankFilter } }];
  } else {
    rankRestriction = restrictToRank(rank);
  }
  let include = setIncludes({
    result,
    summaryValues,
    non_attr_fields,
    includeRawValues,
    includeLineage,
  });
  let exclude = []; // includeRawValues ? [] : ["attributes.values*"];
  let sort = setSortOrder(sortBy, lookupTypes, lookupNames);
  let query = {
    bool: {
      must_not: excludedSources,
      filter: attributesExist
        .concat(identifiers)
        .concat(namesExist)
        .concat(attributeValues)
        .concat(propertyValues)
        .concat(taxonFilter)
        .concat(rankRestriction)
        .concat(lineageRanks)
        .concat(assemblyFilter)
        .concat(sampleFilter),
      ...(optionalAttributesExist && { should: optionalAttributesExist }),
    },
  };
  if (function_score) {
    function_score.query = query;
    query = { function_score };
  }

  if (collateTerm) {
    let collateFilter = await collateAttributes({
      query,
      collateTerm,
      lookupTypes,
      index,
    });
    query.bool.filter = query.bool.filter.concat(collateFilter);
  }

  return {
    size,
    from: offset,
    query,
    _source: {
      include,
      exclude,
    },
    sort,
    aggs,
  };
};
