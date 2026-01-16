import { clearProgress, getProgress, setProgress } from "./progress.js";

import { attrTypes } from "./attrTypes.js";
import { checkResponse } from "./checkResponse.js";
import { client } from "./connection.js";
import { config } from "./config.js";
import { logError } from "./logger.js";
import { processHits } from "./processHits.js";
import { searchByTaxon } from "../queries/searchByTaxon.js";

async function* searchAfterSearch(params, pageSize, idField = "taxon_id") {
  // Initial search with sort for consistent ordering
  let searchParams = {
    ...params,
    size: pageSize,
    body: {
      ...params.body,
      // Ensure we have a sort for consistent pagination
      // Use the result-specific ID field (taxon_id, feature_id, etc.)
      sort: params.body.sort || [{ [idField]: "asc" }],
    },
  };

  let response = await client.search(searchParams, { meta: true });

  while (true) {
    const sourceHits = response.body.hits.hits;

    if (sourceHits.length === 0) {
      break;
    }

    for (const hit of sourceHits) {
      yield hit;
    }

    // If we got fewer results than the page size, we've reached the end
    if (sourceHits.length < pageSize) {
      break;
    }

    // Get the sort values from the last hit for pagination
    const lastHit = sourceHits[sourceHits.length - 1];
    const searchAfter = lastHit.sort;

    // Continue search from where we left off
    searchParams.body.search_after = searchAfter;

    response = await client.search(searchParams, { meta: true });
  }
}

export const getRecordsByTaxon = async (props) => {
  let searchBy = searchByTaxon;
  let active = true;
  let queryId;
  let update;
  if (props.req && props.req.on) {
    queryId = props.req.query.queryId;
    let progress = getProgress(props.req.query.queryId);
    props.req.on("close", () => {
      if (progress && progress.persist) {
        setProgress(queryId, { disconnected: true });
      } else {
        active = false;
      }
    });
    props.req.on("end", () => {
      active = false;
    });
    update = props.update || "x";
    props.includeLineage = true;
  }
  const query = await searchBy(props);
  let { scrollThreshold } = config;
  let body;
  const pageSize = 1000;
  if (
    query.size > 10000 ||
    (query.size >= scrollThreshold &&
      // query.sort.length == 0 &&
      Object.keys(query.aggs).length == 0)
  ) {
    let total = 0;
    let hits = [];
    let startTime = Date.now();
    const idField = `${props.result}_id`;
    for await (const hit of searchAfterSearch(
      {
        index: props.index,
        _source: query._source,
        body: {
          query: query.query,
        },
      },
      pageSize,
      idField
    )) {
      hits.push(hit);
      total++;
      if (queryId && total % 1000 == 0) {
        setProgress(queryId, { [update]: total });
      }
      if (!active || total == query.size) {
        if (queryId && !active) {
          clearProgress(queryId);
        }
        break;
      }
    }
    if (queryId && active) {
      setProgress(queryId, {
        [update]: total,
        ...(update == "x" && { total }),
        complete: true,
      });
    }
    let took = Date.now() - startTime;
    body = {
      took,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: { total: hits.length, hits },
    };
  } else {
    ({ body } = await client
      .search(
        {
          index: props.index,
          body: query,
          rest_total_hits_as_int: true,
        },
        { meta: true }
      )
      .catch((err) => {
        logError({
          message: err.meta.body?.error || err.message,
          ...(props.req && { req: props.req }),
        });
        return err.meta;
      }));
  }

  let results = [];
  let aggs;
  let status = checkResponse({ body });

  let { typesMap, lookupTypes } = await attrTypes({
    result: props.result,
    taxonomy: props.taxonomy,
  });
  // set types
  status.size = props.size;
  status.offset = props.offset;
  if (props.aggregations && !body.aggregations) {
    body.aggregations = props.aggregations;
  }
  if (status.hits) {
    results = processHits({
      body,
      inner_hits: true,
      lca: props.lca,
      names: props.names,
      ranks: props.ranks,
      fields: props.fields,
      lookupTypes,
      bounds: props.bounds,
    });
    if (body.aggregations) {
      aggs = body.aggregations;
    }
  }
  return { status, results, aggs, fields: props.fields, query };
};
