/**
 * Recursively remove ALL inner_hits from any object
 */
const stripAllInnerHits = (obj) => {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => stripAllInnerHits(item));
  }

  const cleaned = JSON.parse(JSON.stringify(obj));

  // Remove inner_hits at any level
  if (cleaned.inner_hits) {
    delete cleaned.inner_hits;
  }

  // Recursively clean all properties
  for (const key in cleaned) {
    if (cleaned.hasOwnProperty(key)) {
      if (Array.isArray(cleaned[key])) {
        cleaned[key] = cleaned[key].map((item) => stripAllInnerHits(item));
      } else if (typeof cleaned[key] === "object") {
        cleaned[key] = stripAllInnerHits(cleaned[key]);
      }
    }
  }

  return cleaned;
};

export const combineOrQueries = (queries) => {
  if (!Array.isArray(queries)) {
    console.error("combineOrQueries: queries is not an array", typeof queries);
    return null;
  }

  if (queries.length === 0) {
    console.error("combineOrQueries: queries array is empty");
    return null;
  }

  // Filter out null/undefined queries and log if any are found
  const validQueries = queries.filter((q) => {
    if (!q) {
      console.error("combineOrQueries: Found null/undefined query in array");
      return false;
    }
    return true;
  });

  if (validQueries.length === 0) {
    console.error("combineOrQueries: No valid queries after filtering");
    return null;
  }

  if (validQueries.length === 1) {
    return validQueries[0];
  }

  // Use first query as template for top-level settings
  const template = validQueries[0];
  const size = template.size || 10;
  const from = template.from || 0;
  let { _source, sort } = template;

  // Collect all aggregations from all queries
  let aggs = {};
  if (Array.isArray(validQueries)) {
    validQueries.forEach((q) => {
      if (q && q.aggs && typeof q.aggs === "object") {
        aggs = { ...aggs, ...q.aggs };
      }
    });
  }

  // Build should clause from queries, stripping ALL inner_hits
  // Each query object has a 'query' property containing the Elasticsearch query
  const shouldClauses = validQueries
    .map((q) => {
      if (!q || !q.query) {
        console.error("combineOrQueries: Query missing .query property", q);
        return null;
      }
      return stripAllInnerHits(q.query);
    })
    .filter((q) => q !== null);

  if (shouldClauses.length === 0) {
    console.error("combineOrQueries: No valid should clauses generated");
    return null;
  }

  // Build combined query with should clause
  const combinedQuery = {
    bool: {
      should: shouldClauses,
      minimum_should_match: 1,
    },
  };

  // Final pass: strip any remaining inner_hits from the combined query
  const cleanedCombinedQuery = stripAllInnerHits(combinedQuery);

  const result = {
    size,
    from,
    query: cleanedCombinedQuery,
  };

  if (_source) {
    result._source = _source;
  }
  if (sort) {
    result.sort = sort;
  }
  if (Object.keys(aggs).length > 0) {
    result.aggs = aggs;
  }

  return result;
};
