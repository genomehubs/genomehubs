import { attrTypes } from "../functions/attrTypes.js";
import { client } from "../functions/connection.js";
import { formatJson } from "../functions/formatJson.js";
import { getResults } from "../functions/getResults.js";
import { indexName } from "../functions/indexName.js";
import { logError } from "../functions/logger.js";
import { parseFields } from "../functions/parseFields.js";
import { processHits } from "../functions/processHits.js";

/**
 * Execute multiple searches simultaneously using msearch.
 * Useful for parallel queries that don't depend on each other.
 *
 * Request body (POST):
 * {
 *   "searches": [
 *     {
 *       "query": "tax_rank(species)",
 *       "result": "taxon",
 *       "taxonomy": "ncbi",
 *       "fields": "taxon_id,scientific_name",
 *       "limit": 100
 *     },
 *     {
 *       "query": "tax_rank(genus)",
 *       "result": "taxon",
 *       "taxonomy": "ncbi",
 *       "limit": 50
 *     }
 *   ]
 * }
 *
 * Response:
 * {
 *   "status": { "success": true },
 *   "results": [
 *     { "status": "success", "count": 100, "hits": [...] },
 *     { "status": "success", "count": 50, "hits": [...] }
 *   ]
 * }
 */
export const getMsearch = async (req, res) => {
  try {
    const { searches = [] } = req.body;

    if (!Array.isArray(searches) || searches.length === 0) {
      return res.status(400).send({
        status: {
          success: false,
          error: "Request body must contain array of searches",
        },
      });
    }

    if (searches.length > 100) {
      return res.status(400).send({
        status: {
          success: false,
          error: "Maximum 100 searches per request",
        },
      });
    }

    // Build msearch request body
    const msearchBody = [];

    // For each search, build the ES query and add to msearch body
    for (const searchRequest of searches) {
      const {
        query,
        result = "taxon",
        taxonomy,
        fields,
        limit = 100,
        offset = 0,
        sortBy,
        sortOrder,
      } = searchRequest;

      if (!query) {
        return res.status(400).send({
          status: {
            success: false,
            error: "Each search must include a query parameter",
          },
        });
      }

      try {
        // Build search query using the same function as the main search endpoint
        const searchQuery = await getResults({
          query,
          result,
          taxonomy,
          fields,
          size: Math.min(parseInt(limit) || 100, 10000),
          offset: Math.max(parseInt(offset) || 0, 0),
        });

        // getResults returns { query: { size, from, query (with inner_hits), _source, aggs } }
        // Use the complete query structure it provides
        const searchBody = {
          size: searchQuery.query.size || 100,
          from: searchQuery.query.from || 0,
          query: searchQuery.query.query,
        };

        if (searchQuery.query._source) {
          searchBody._source = searchQuery.query._source;
        }

        // getResults includes aggregations in the query object
        // Include those if present (inner_hits are already part of the query object)
        if (searchQuery.query.aggs) {
          searchBody.aggs = searchQuery.query.aggs;
        }

        if (sortBy) {
          searchBody.sort = [
            {
              [sortBy]: sortOrder || "asc",
            },
          ];
        }

        // Add index header and query body to msearch
        msearchBody.push(
          { index: indexName({ result, taxonomy }) },
          searchBody
        );
      } catch (error) {
        logError({
          req,
          message: `msearch query build error: ${error.message}`,
        });
        return res.status(400).send({
          status: {
            success: false,
            error: `Invalid search query: ${error.message}`,
          },
        });
      }
    }

    // Execute all searches at once
    console.log(
      "msearchBody being sent to Elasticsearch:",
      JSON.stringify(msearchBody, null, 2)
    );
    const mSearchResponse = await client.msearch({ body: msearchBody });
    const responses =
      mSearchResponse?.body?.responses || mSearchResponse?.responses || [];

    if (!Array.isArray(responses)) {
      throw new Error("Invalid msearch response structure");
    }

    // Process responses and format results using processHits to extract field data
    const results = await Promise.all(
      responses.map(async (response, index) => {
        if (response.error) {
          return {
            status: "error",
            error: response.error.reason || response.error.type,
            search: searches[index],
          };
        }

        const searchRequest = searches[index];
        let processedHits = [];

        if (
          response.hits &&
          response.hits.hits &&
          response.hits.hits.length > 0
        ) {
          // Parse fields to get what attributes are requested
          const parsedFields = await parseFields({
            result: searchRequest.result,
            fields: searchRequest.fields || "",
            taxonomy: searchRequest.taxonomy,
          });

          // Get field metadata for lookupTypes
          const { lookupTypes } = await attrTypes({
            taxonomy: searchRequest.taxonomy,
          });

          // Use processHits to process the hits with inner_hits data
          // This extracts attributes, names, lineage, etc. from inner_hits
          processedHits = processHits({
            body: response,
            fields: parsedFields,
            lookupTypes: lookupTypes[searchRequest.result],
            names: true,
            ranks: true,
            inner_hits: true,
          });
        }

        return {
          status: "success",
          count: processedHits.length || 0,
          total: response.hits?.total?.value || processedHits.length || 0,
          hits: processedHits,
          search: searchRequest,
        };
      })
    );

    return res.status(200).send(
      formatJson(
        {
          status: { success: true },
          results,
        },
        req.query.indent
      )
    );
  } catch (error) {
    logError({ req, message: error.message });
    return res.status(500).send({
      status: {
        success: false,
        error: error.message || "Failed to execute searches",
      },
    });
  }
};
