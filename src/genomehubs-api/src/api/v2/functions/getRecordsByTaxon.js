import { clearProgress, setProgress } from "./progress";

import { checkResponse } from "./checkResponse";
import { client } from "./connection";
import { config } from "./config";
import { logError } from "./logger";
import { processHits } from "./processHits";
import { searchByTaxon } from "../queries/searchByTaxon";

async function* scrollSearch(params, scroll) {
  if (!params.scroll) {
    params = { ...params, scroll };
  }

  let response = await client.search(params);

  while (true) {
    const sourceHits = response.body.hits.hits;

    if (sourceHits.length === 0) {
      break;
    }

    for (const hit of sourceHits) {
      yield hit;
    }

    if (!response.body._scroll_id) {
      break;
    }

    response = await client.scroll({
      scrollId: response.body._scroll_id,
      scroll: params.scroll,
    });
  }
}

export const getRecordsByTaxon = async (props) => {
  let searchBy = searchByTaxon;
  let active = true;
  let queryId;
  let update;
  if (props.req) {
    props.req.on("close", () => {
      active = false;
    });
    props.req.on("end", () => {
      active = false;
    });
    queryId = props.req.query.queryId;
    update = props.update || "x";
  }
  const query = await searchBy(props);
  let scrollThreshold = config.scrollThreshold;
  let scrollDuration = config.scrollDuration;
  let body;
  if (
    query.size >= scrollThreshold &&
    // query.sort.length == 0 &&
    Object.keys(query.aggs).length == 0
  ) {
    let total = 0;
    let hits = [];
    let startTime = Date.now();
    for await (const hit of scrollSearch(
      {
        index: props.index,
        size: 1000,
        _source: query._source,
        body: {
          query: query.query,
        },
      },
      scrollDuration
    )) {
      hits.push(hit);
      total++;
      if (total % 1000 == 0) {
        if (queryId) {
          setProgress(queryId, { [update]: total });
        }
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
      .search({
        index: props.index,
        body: query,
        rest_total_hits_as_int: true,
      })
      .catch((err) => {
        logError({
          message: err.meta.body.error,
          ...(props.req && { req: props.req }),
        });
        return err.meta;
      }));
  }

  let results = [];
  let aggs;
  let status = checkResponse({ body });
  status.size = props.size;
  status.offset = props.offset;
  if (status.hits) {
    results = processHits({
      body,
      inner_hits: true,
      lca: props.lca,
      names: props.names,
      ranks: props.ranks,
    });
    if (body.aggregations) {
      aggs = body.aggregations;
    }
  }
  return { status, results, aggs, query, fields: props.fields };
};
