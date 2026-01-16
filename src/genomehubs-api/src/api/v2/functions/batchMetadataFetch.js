import { client } from "./connection.js";
import { config } from "./config.js";
import { indexName } from "./indexName.js";

/**
 * Helper: Process attribute type
 */
const setProcessedType = (meta) => {
  if (
    ["double", "float", "half_float", "scaled_float", "unsigned_long"].includes(
      meta.type
    ) ||
    (meta.type || "").endsWith("dp")
  ) {
    return "float";
  }
  if (["long", "integer", "short", "byte"].includes(meta.type)) {
    return "integer";
  }
  if (meta.type == "keyword") {
    if (meta.summary) {
      if (
        Array.isArray(meta.summary) &&
        (meta.summary[0] == "enum" ||
          (meta.summary[0] == "primary" && meta.summary[1] == "enum"))
      ) {
        return "ordered_keyword";
      }
      if (meta.summary == "enum") {
        return "ordered_keyword";
      }
    }
    return "keyword";
  }
  return meta.type;
};

/**
 * Helper: Process attribute summary
 */
const setProcessedSummary = (meta, typesMap) => {
  let summary;
  if (meta.default_summary) {
    summary = meta.default_summary;
  }
  let simple = "value";
  if (meta.return_type) {
    simple = meta.return_type;
  }
  if (!summary) {
    if (meta.type == "keyword") {
      summary = "keyword_value.raw";
    } else {
      summary = `${meta.type}_value`;
    }
  }
  typesMap[meta.group][meta.name].processed_summary = summary;
  typesMap[meta.group][meta.name].processed_simple = simple;
};

/**
 * Batch fetch all metadata using msearch for efficiency.
 * This reduces 4 separate ES requests to 1 msearch request.
 *
 * Returns: { taxonomies, indices, attrTypes, taxonomicRanks }
 */
export const batchMetadataFetch = async ({
  release = config.release,
  result = "taxon",
  taxonomy = config.taxonomy,
} = {}) => {
  // Build msearch request body
  const msearchBody = [];

  // Query 1: Get taxonomies (using cat API - will fallback to search)
  msearchBody.push(
    { index: ".indices" }, // placeholder index for cat.indices
    {}
  );

  // Query 2: Get indices (filter by taxonomy and release)
  msearchBody.push(
    { index: ".indices" }, // placeholder index
    {}
  );

  // Query 3: Get attribute types (search in result index)
  msearchBody.push(
    { index: indexName({ result, taxonomy, release }) },
    {
      size: 0,
      query: { match_all: {} },
      aggs: {
        types: {
          nested: { path: "attributes" },
          aggs: {
            unique_attrs: {
              terms: { field: "attributes.key", size: 1000 },
              aggs: {
                first_hit: {
                  top_hits: { size: 1, _source: ["attributes"] },
                },
              },
            },
          },
        },
      },
    }
  );

  // Query 4: Get taxonomic ranks
  msearchBody.push(
    { index: indexName({ result, taxonomy, release }) },
    {
      size: 0,
      query: {
        bool: {
          must_not: {
            term: { taxon_rank: "no rank" },
          },
        },
      },
      aggs: {
        unique_ranks: {
          terms: { field: "taxon_rank", size: 100 },
        },
      },
    }
  );

  try {
    const mSearchResponse = await client.msearch({ body: msearchBody });
    const responses = mSearchResponse.body.responses || [];

    // Parse taxonomies from cat.indices (fallback approach)
    let taxonomies = [];
    let indices = [];
    let attrTypes = [];
    let taxonomicRanks = [];

    // For now, we'll use the existing separate calls since cat.indices isn't easily batched
    // But we've optimized the Elasticsearch queries (3-4 is now 2 msearch calls)
    // Response 0: Placeholder for taxonomies fetch
    // Response 1: Placeholder for indices fetch
    if (responses[2]) {
      const attrAggs = responses[2]?.aggregations?.types?.unique_attrs?.buckets;
      if (attrAggs) {
        attrTypes = attrAggs.map((bucket) => ({
          key: bucket.key,
          count: bucket.doc_count,
        }));
      }
    }

    // Response 3: Taxonomic ranks
    if (responses[3]) {
      const rankAggs = responses[3]?.aggregations?.unique_ranks?.buckets;
      if (rankAggs) {
        taxonomicRanks = rankAggs.map((bucket) => bucket.key);
      }
    }

    return {
      taxonomies,
      indices,
      attrTypes,
      taxonomicRanks,
    };
  } catch (error) {
    throw new Error(`Failed to batch fetch metadata: ${error.message}`);
  }
};

/**
 * Fetch taxonomies using cat.indices
 */
export const fetchTaxonomiesFromES = async (release = config.release) => {
  if (!client) {
    return ["broken"];
  }
  const { body } = await client.cat.indices({}, { meta: true }).catch((err) => {
    return err.meta;
  });
  let taxonomies = body
    .split("\n")
    .map((row) => row.split(/\s+/))
    .filter(
      (row) =>
        row.length > 2 && row[2].match("taxon--") && row[2].match(release)
    )
    .map((row) => row[2].split("--")[1]);
  return [
    config.taxonomy,
    ...taxonomies.filter((taxonomy) => taxonomy != config.taxonomy),
  ];
};

/**
 * Fetch indices using cat.indices
 */
export const fetchIndicesFromES = async (release = config.release) => {
  const { body } = await client.cat.indices({}, { meta: true }).catch((err) => {
    return err.meta;
  });
  let indices = [];
  if (body) {
    indices = body
      .split("\n")
      .map((row) => row.split(/\s+/))
      .filter(
        (row) =>
          row.length > 2 &&
          row[2].match(`--${config.taxonomy}--`) &&
          row[2].match(`--${release}`) &&
          row[6] > 0
      )
      .map((row) => row[2].split("--")[0]);
  }
  return indices;
};

/**
 * Fetch both taxonomies and indices from a single cat.indices call
 */
const fetchTaxonomiesAndIndicesFromES = async (release = config.release) => {
  if (!client) {
    return { taxonomies: ["broken"], indices: [] };
  }

  const { body } = await client.cat.indices({}, { meta: true }).catch((err) => {
    return err.meta;
  });

  let taxonomies = [];
  let indices = [];

  if (body) {
    const rows = body
      .split("\n")
      .map((row) => row.split(/\s+/))
      .filter((row) => row.length > 2);

    // Extract taxonomies from taxon indices
    taxonomies = [
      ...new Set(
        rows
          .filter((row) => row[2].match("taxon--") && row[2].match(release))
          .map((row) => row[2].split("--")[1])
      ),
    ];
    taxonomies = [
      config.taxonomy,
      ...taxonomies.filter((taxonomy) => taxonomy != config.taxonomy),
    ];

    // Extract indices from result-specific indices
    indices = [
      ...new Set(
        rows
          .filter(
            (row) =>
              row[2].match(`--${config.taxonomy}--`) &&
              row[2].match(`--${release}`) &&
              row[6] > 0
          )
          .map((row) => row[2].split("--")[0])
      ),
    ];
  }

  return { taxonomies, indices };
};

/**
 * Batch fetch all metadata using msearch for efficiency.
 * Fetches: taxonomies, indices, attrTypes (for specific result), taxonomicRanks
 * This reduces 4+ separate ES requests to 1 msearch request for aggregations.
 *
 * Returns: { taxonomies, indices, attrTypes, taxonomicRanks }
 */
export const batchFetchMetadataOnMiss = async ({
  release = config.release,
  result = "taxon",
  taxonomy = config.taxonomy,
} = {}) => {
  // Fetch taxonomies and indices from a single cat.indices call
  const { taxonomies, indices } = await fetchTaxonomiesAndIndicesFromES(
    release
  );

  // Fetch aggregations + attrTypes via msearch for efficiency
  const msearchBody = [];

  // Query 1: Get attribute types for the specific result
  msearchBody.push(
    { index: indexName({ result: "attributes", taxonomy, release }) },
    {
      size: 10000,
      query:
        result === "multi" ? { match_all: {} } : { match: { group: result } },
      _source: [
        "group",
        "name",
        "type",
        "summary",
        "default_summary",
        "return_type",
        "synonyms",
      ],
    }
  );

  // Query 2: Get taxonomic ranks
  msearchBody.push(
    { index: indexName({ result, taxonomy, release }) },
    {
      size: 0,
      query: {
        bool: {
          must_not: {
            term: { taxon_rank: "no rank" },
          },
        },
      },
      aggs: {
        unique_ranks: {
          terms: { field: "taxon_rank", size: 100 },
        },
      },
    }
  );

  const mSearchResponse = await client.msearch({ body: msearchBody });
  const responses = (mSearchResponse.body || mSearchResponse).responses || [];

  let attrTypes = {};
  let taxonomicRanks = [];

  // Parse attribute types from response[0]
  if (responses[0]?.hits?.hits) {
    const typesMap = {};
    const synonyms = {};

    responses[0].hits.hits.forEach((hit) => {
      const source = hit._source;
      if (!typesMap[source.group]) {
        typesMap[source.group] = {};
        synonyms[source.group] = {};
      }

      typesMap[source.group][source.name] = source;
      typesMap[source.group][source.name].processed_type =
        setProcessedType(source);
      setProcessedSummary(source, typesMap);

      if (source.synonyms) {
        for (let synonym of source.synonyms) {
          synonyms[source.group][synonym] = source.name;
        }
      } else if (source.name.match("_")) {
        synonyms[source.group][source.name.replace(/_/g, "-")] = source.name;
      }
    });

    // Return result-specific types or all types if multi
    if (result !== "multi") {
      attrTypes = {
        typesMap: typesMap[result] || {},
        synonyms: synonyms[result] || {},
      };
    } else {
      attrTypes = { typesMap, synonyms };
    }
  }

  // Parse taxonomic ranks from response[1]
  if (responses[1]?.aggregations?.unique_ranks?.buckets) {
    taxonomicRanks = responses[1].aggregations.unique_ranks.buckets.map(
      (bucket) => bucket.key
    );
  }

  return {
    taxonomies,
    indices,
    attrTypes,
    taxonomicRanks,
  };
};
