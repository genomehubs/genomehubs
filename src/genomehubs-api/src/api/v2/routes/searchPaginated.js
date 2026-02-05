import { client } from "../functions/connection.js";
import { formatJson } from "../functions/formatJson.js";
import { getResults } from "../functions/getResults.js";
import { indexName } from "../functions/indexName.js";
import { logError } from "../functions/logger.js";

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
 *   - sortBy: Sort field (default: "{result}_id")
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
      sortBy = undefined,
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

    // Use getResults with size=0 to validate the query and get metadata
    // This ensures the query is properly parsed and validated
    const queryValidation = await getResults({
      ...req.query,
      size: 0,
    });

    if (!queryValidation.status.success) {
      return res.status(400).send({
        status: {
          success: false,
          error:
            queryValidation.status && queryValidation.status.error
              ? queryValidation.status.error
              : "Invalid query",
        },
      });
    }

    // Build the sort clause
    // Default to the per-index ID field when no explicit sort is provided
    const idField = `${result}_id`;
    const effectiveSortBy = sortBy || idField;
    // Guard against requests explicitly sorting on `_id`
    const safeSortBy = effectiveSortBy === "_id" ? idField : effectiveSortBy;
    const sortClause = [{ [safeSortBy]: sortOrder }];
    // Add a tiebreaker for consistent pagination.
    // Avoid sorting on the special `_id` field because fielddata on `_id`
    // may be disabled in some clusters (causes illegal_argument_exception).
    // Use the per-index ID field (e.g. taxon_id, assembly_id) as a tiebreaker.
    if (safeSortBy !== idField) {
      sortClause.push({ [idField]: sortOrder });
    }

    // Now use getResults with the actual page size for retrieving data
    // Set offset to 0 since we're using search_after for pagination
    let offset = 0;

    // If searchAfter is provided, we still use offset=0 but search_after will handle pagination
    const resultsResponse = await getResults({
      ...req.query,
      size: pageSize,
      offset: offset,
      sortBy,
    });

    if (!resultsResponse.status.success) {
      return res.status(400).send({
        status: {
          success: false,
          error:
            resultsResponse.status && resultsResponse.status.error
              ? resultsResponse.status.error
              : "Search failed",
        },
      });
    }

    // Extract the Elasticsearch query that was built
    // We need to execute a direct ES query to get the sort values for pagination
    const searchParams = {
      index: indexName({ result, taxonomy }),
      size: pageSize,
      body: resultsResponse.query || { match_all: {} },
      sort: sortClause,
      track_total_hits: false,
    };

    // If _source is defined in the results, use it
    if (resultsResponse._source) {
      searchParams._source = resultsResponse._source;
    }

    // Add search_after if provided
    if (searchAfter) {
      try {
        const searchAfterArray = JSON.parse(
          typeof searchAfter === "string"
            ? searchAfter
            : JSON.stringify(searchAfter),
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
    const { hits, took } = response.body.hits;

    // Determine if there are more results
    const hasMore = hits.length === pageSize;
    const lastSearchAfter = hits.length > 0 ? hits[hits.length - 1].sort : null;

    return res.status(200).send(
      formatJson(
        {
          status: {
            success: true,
            hits: hits.length,
            took,
            size: pageSize,
            offset: 0,
          },
          hits,
          pagination: {
            limit: pageSize,
            count: hits.length,
            hasMore,
            searchAfter: lastSearchAfter,
          },
        },
        req.query.indent,
      ),
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
