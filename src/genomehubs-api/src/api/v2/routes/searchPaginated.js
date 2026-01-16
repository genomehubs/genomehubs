import { client } from "../functions/connection.js";
import { formatJson } from "../functions/formatJson.js";
import { getResults } from "../functions/getResults.js";
import { indexName } from "../functions/indexName.js";
import { logError } from "../functions/logger.js";
import { searchByTaxon } from "../queries/searchByTaxon.js";

/**
 * Paginated search endpoint using search_after for efficient large result set traversal.
 * Supports fetching results in pages without maintaining server-side state.
 *
 * Query Parameters:
 *   - query: The search query (e.g., "tax_rank(species)")
 *   - result: The result type (e.g., "taxon", "assembly")
 *   - taxonomy: The taxonomy to search in (e.g., "ncbi")
 *   - limit: Number of results per page (default: 100, max: 10000)
 *   - searchAfter: JSON array of sort values from the last result (for pagination)
 *   - sortBy: Sort field (default: "_id")
 *   - sortOrder: Sort order "asc" or "desc" (default: "asc")
 *   - fields: Comma-separated list of fields to return
 *
 * Response:
 *   {
 *     "status": { "success": true },
 *     "hits": [
 *       { "_id": "...", "_source": {...}, "sort": [...] },
 *       ...
 *     ],
 *     "pagination": {
 *       "limit": 100,
 *       "count": 100,
 *       "hasMore": true,
 *       "searchAfter": ["value1", "value2"]  // Use this in next request
 *     }
 *   }
 */
export const getSearchPaginated = async (req, res) => {
  try {
    const {
      query,
      result = "taxon",
      taxonomy,
      limit = 100,
      searchAfter,
      sortBy = "_id",
      sortOrder = "asc",
    } = req.query;

    // Validate limit
    const pageSize = Math.min(Math.max(parseInt(limit) || 100, 1), 10000);

    if (!query) {
      return res.status(400).send({
        status: { success: false, error: "query parameter is required" },
      });
    }

    if (!result) {
      return res.status(400).send({
        status: { success: false, error: "result parameter is required" },
      });
    }

    // Get the search query using existing query builder
    const searchQuery = await searchByTaxon({
      query,
      result,
      taxonomy,
      size: pageSize,
    });

    // Build the sort clause
    const sortClause = [{ [sortBy]: sortOrder }];
    // Add _id as tiebreaker for consistent pagination
    if (sortBy !== "_id") {
      sortClause.push({ _id: sortOrder });
    }

    // Build the search parameters
    const searchParams = {
      index: indexName({ result, taxonomy }),
      size: pageSize,
      _source: searchQuery._source,
      body: {
        query: searchQuery.query,
        sort: sortClause,
        track_total_hits: false, // More efficient for large result sets
      },
    };

    // Add search_after if provided
    if (searchAfter) {
      try {
        const searchAfterArray = JSON.parse(
          typeof searchAfter === "string"
            ? searchAfter
            : JSON.stringify(searchAfter)
        );
        if (Array.isArray(searchAfterArray)) {
          searchParams.body.search_after = searchAfterArray;
        }
      } catch (e) {
        return res.status(400).send({
          status: {
            success: false,
            error: "searchAfter must be a valid JSON array",
          },
        });
      }
    }

    // Execute the search
    const response = await client.search(searchParams, { meta: true });
    const { hits } = response.body.hits;

    // Determine if there are more results
    const hasMore = hits.length === pageSize;
    const lastSearchAfter = hits.length > 0 ? hits[hits.length - 1].sort : null;

    return res.status(200).send(
      formatJson(
        {
          status: { success: true },
          hits,
          pagination: {
            limit: pageSize,
            count: hits.length,
            hasMore,
            searchAfter: lastSearchAfter,
          },
        },
        req.query.indent
      )
    );
  } catch (error) {
    logError({ req, message: error.message });
    return res.status(500).send({
      status: {
        success: false,
        error: error.message || "Failed to fetch paginated results",
      },
    });
  }
};
