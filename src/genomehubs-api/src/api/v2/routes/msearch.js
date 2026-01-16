import { client } from "../functions/connection.js";
import { formatJson } from "../functions/formatJson.js";
import { indexName } from "../functions/indexName.js";
import { logError } from "../functions/logger.js";
import { searchByTaxon } from "../queries/searchByTaxon.js";

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
        // Build search query using existing query builder
        const searchQuery = await searchByTaxon({
          query,
          result,
          taxonomy,
          fields,
          size: Math.min(parseInt(limit) || 100, 10000),
          offset: Math.max(parseInt(offset) || 0, 0),
        });

        // Add index header and query body to msearch
        msearchBody.push(
          { index: indexName({ result, taxonomy }) },
          {
            query: searchQuery.query,
            size: searchQuery.size || 100,
            from: searchQuery.from || 0,
            _source: searchQuery._source,
            ...(sortBy && {
              sort: [
                {
                  [sortBy]: sortOrder || "asc",
                },
              ],
            }),
          }
        );
      } catch (error) {
        return res.status(400).send({
          status: {
            success: false,
            error: `Invalid search query: ${error.message}`,
          },
        });
      }
    }

    // Execute all searches at once
    const mSearchResponse = await client.msearch({ body: msearchBody });
    const responses =
      mSearchResponse?.body?.responses || mSearchResponse?.responses || [];

    if (!Array.isArray(responses)) {
      throw new Error("Invalid msearch response structure");
    }

    // Process responses and format results
    const results = responses.map((response, index) => {
      if (response.error) {
        return {
          status: "error",
          error: response.error.reason || response.error.type,
          search: searches[index],
        };
      }

      const { hits } = response.hits || {};
      return {
        status: "success",
        count: hits?.length || 0,
        total: response.hits?.total?.value || hits?.length || 0,
        hits: hits || [],
        search: searches[index],
      };
    });

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
