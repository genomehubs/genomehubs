/**
 * Test fixtures and mock data
 */

export const mockSearchQuery = {
  queryTerms: ["taxon~Homo", "assembly_type~reference genome"],
  results: {
    hits: {
      total: { value: 42 },
      hits: [
        {
          _id: "GCA_000001405.29",
          _source: {
            taxon_id: 9606,
            species_name: "Homo sapiens",
            assembly_name: "GRCh38.p13",
          },
        },
      ],
    },
  },
};

export const mockReportQuery = {
  reportId: "test-report-123",
  queryTerms: ["taxon~Homo"],
  reportTemplate: "taxon",
  params: {
    countGenomes: true,
    treeThreshold: 5,
  },
};

export const mockFieldMetadata = [
  {
    name: "taxon_id",
    type: "long",
    searchable: true,
    display_name: "Taxon ID",
  },
  {
    name: "species_name",
    type: "keyword",
    searchable: true,
    display_name: "Species Name",
  },
  {
    name: "assembly_type",
    type: "keyword",
    searchable: true,
    display_name: "Assembly Type",
  },
];

export const mockAutocompleteData = [
  "Homo",
  "Homo sapiens",
  "Homo neanderthalensis",
];

/**
 * Create mock search response matching Elasticsearch structure
 */
export function createMockSearchResponse(overrides = {}) {
  return {
    hits: {
      total: { value: 10 },
      hits: [],
      ...overrides.hits,
    },
    aggregations: {
      ...overrides.aggregations,
    },
  };
}

/**
 * Create mock report response
 */
export function createMockReportResponse(overrides = {}) {
  return {
    status: "complete",
    id: "test-report-123",
    data: {
      plots: [],
      ...overrides.data,
    },
    ...overrides,
  };
}
