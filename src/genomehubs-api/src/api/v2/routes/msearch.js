import { attrTypes } from "../functions/attrTypes.js";
import { client } from "../functions/connection.js";
import { formatCsv } from "../functions/formatCsv.js";
import { formatJson } from "../functions/formatJson.js";
import { getResults } from "../functions/getResults.js";
import { indexName } from "../functions/indexName.js";
import { logError } from "../functions/logger.js";
import { parseFields } from "../functions/parseFields.js";
import { processHits } from "../functions/processHits.js";

const BATCH_SEARCH_DELIMITER = "semicolon";

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

/**
 * GET endpoint for downloading batch search results in specified format
 * Query parameters define individual searches as key=value pairs
 * Multiple searches can be specified using array notation: originalQueries[0]=canis&originalQueries[1]=rosa
 *
 * Query Parameters:
 *   - originalQueries[n]: Individual search terms
 *   - result: Result type (taxon, assembly, etc.)
 *   - taxonomy: Taxonomy to search
 *   - fields: Fields to include
 *   - format: Output format (tsv, csv, json) - via Accept header
 *   - tidyData: Whether to return tidy data format
 *   - includeRawValues: Whether to include raw values
 *   - names, ranks: Additional filter parameters
 */
export const getMsearchDownload = async (req, res) => {
  try {
    // Get the batch query string and split on delimiter (newline or semicolon)
    const queryString = req.query.query;
    if (!queryString) {
      return res.status(400).send({
        status: {
          success: false,
          error: "query parameter is required",
        },
      });
    }

    // Split on newline or semicolon (matching client-side delimiter logic)
    const delimiter =
      BATCH_SEARCH_DELIMITER === "comma"
        ? /[,;\n]/
        : BATCH_SEARCH_DELIMITER === "semicolon"
        ? /[;\n]/
        : /\n/;
    const queries = queryString
      .split(delimiter)
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    if (queries.length === 0) {
      return res.status(400).send({
        status: {
          success: false,
          error: "At least one query is required",
        },
      });
    }

    // Build searches array from split queries
    const searches = queries.map((query) => ({
      query: query.match(/[\(\)<>=]/) ? query : `tax_name(${query})`,
      result: req.query.result || "taxon",
      taxonomy: req.query.taxonomy,
      fields: req.query.fields !== undefined ? req.query.fields : "",
      // Cap limit at Elasticsearch max_result_window (10000) for msearch
      // Downloads will get results in pages as needed
      limit: Math.min(parseInt(req.query.limit || 10000, 10), 10000),
      offset: parseInt(req.query.offset || 0, 10),
    }));

    // Execute all searches using existing msearch logic
    const msearchBody = [];

    for (const searchRequest of searches) {
      const { query, result, taxonomy } = searchRequest;

      try {
        const searchQuery = await getResults({
          query,
          result,
          taxonomy,
          size: searchRequest.limit,
          from: searchRequest.offset,
        });

        // getResults returns { query: { size, from, query, _source, aggs } }
        // Build proper msearch body structure
        const searchBody = {
          size: searchQuery.query.size || 100,
          from: searchQuery.query.from || 0,
          query: searchQuery.query.query,
        };

        if (searchQuery.query._source) {
          searchBody._source = searchQuery.query._source;
        }

        if (searchQuery.query.aggs) {
          searchBody.aggs = searchQuery.query.aggs;
        }

        // Add index header and query body to msearch
        msearchBody.push(
          { index: indexName({ result, taxonomy }) },
          searchBody
        );
      } catch (error) {
        logError({
          req,
          message: `msearch download query build error: ${error.message}`,
        });
        return res.status(400).send({
          status: {
            success: false,
            error: `Invalid search query: ${error.message}`,
          },
        });
      }
    }

    // Execute msearch
    const response = await client.msearch({
      body: msearchBody,
    });

    // Extract responses - check both response.body.responses and response.responses
    const responses = response?.body?.responses || response?.responses || [];

    console.log("msearch download - responses count:", responses.length);
    console.log(
      "msearch download - first response sample:",
      JSON.stringify(responses[0], null, 2).substring(0, 500)
    );

    // Combine all hits from all search responses, processing them through processHits
    const allHits = [];
    if (Array.isArray(responses)) {
      for (let idx = 0; idx < responses.length; idx++) {
        const searchResponse = responses[idx];
        if (searchResponse.error) {
          // Log error but continue with other results
          console.error(
            "msearch download - search error:",
            searchResponse.error
          );
          continue;
        }

        if (searchResponse.hits?.hits && searchResponse.hits.hits.length > 0) {
          console.log(
            "msearch download - hits found:",
            searchResponse.hits.hits.length
          );

          // Parse fields to get what attributes are requested
          const parsedFields = await parseFields({
            result: searches[idx].result,
            fields: searches[idx].fields || "",
            taxonomy: searches[idx].taxonomy,
          });

          // Get field metadata for lookupTypes
          const { lookupTypes } = await attrTypes({
            taxonomy: searches[idx].taxonomy,
          });

          // Process hits through processHits to extract field data properly
          const processedHits = processHits({
            body: searchResponse,
            fields: parsedFields,
            lookupTypes: lookupTypes[searches[idx].result],
            names: true,
            ranks: true,
            inner_hits: true,
          });

          // Wrap each processed hit with result property for formatCsv
          allHits.push(
            ...processedHits.map((hit) => ({
              result: hit.result || hit,
            }))
          );
        }
      }
    }

    console.log("msearch download - total hits:", allHits.length);

    // Format response based on query parameter
    res.format({
      json: () => {
        if (req.query.filename) {
          const filename = `${req.query.filename.replace(/\.json$/, "")}.json`;
          res.attachment(filename);
        }
        res.type("application/json");
        res.status(200).send({
          status: { success: true },
          results: allHits,
        });
      },

      csv: async () => {
        const opts = {
          delimiter: ",",
          fields: await parseFields({ ...req.query }),
          names:
            typeof req.query.names === "string"
              ? req.query.names.split(/\s*,\s*/)
              : [],
          ranks:
            typeof req.query.ranks === "string"
              ? req.query.ranks.split(/\s*,\s*/)
              : [],
          tidyData: req.query.tidyData,
          includeRawValues: req.query.includeRawValues,
          result: req.query.result,
        };

        const csv = await formatCsv({ results: allHits }, opts);
        if (req.query.filename) {
          const filename = `${req.query.filename.replace(/\.csv$/, "")}.csv`;
          res.attachment(filename);
        }
        res.type("text/csv");
        res.status(200).send(csv);
      },

      tsv: async () => {
        const opts = {
          delimiter: "\t",
          fields: await parseFields({ ...req.query }),
          names:
            typeof req.query.names === "string"
              ? req.query.names.split(/\s*,\s*/)
              : [],
          ranks:
            typeof req.query.ranks === "string"
              ? req.query.ranks.split(/\s*,\s*/)
              : [],
          tidyData: req.query.tidyData,
          includeRawValues: req.query.includeRawValues,
          result: req.query.result,
          quote: "",
        };

        const tsv = await formatCsv({ results: allHits }, opts);
        if (req.query.filename) {
          const filename = `${req.query.filename.replace(/\.tsv$/, "")}.tsv`;
          res.attachment(filename);
        }
        res.type("text/tab-separated-values");
        res.status(200).send(tsv);
      },
    });
  } catch (error) {
    logError({ req, message: error.message });
    return res.status(500).send({
      status: {
        success: false,
        error: error.message || "Failed to download batch search results",
      },
    });
  }
};
