import { cacheStore, cachedResponse, pingCache } from "../functions/cache.js";
import {
  clearProgress,
  getProgress,
  isProgressComplete,
  setProgress,
} from "../functions/progress.js";

import { formatCsv } from "../functions/formatCsv.js";
import { formatJson } from "../functions/formatJson.js";
import { getBounds } from "../reports/getBounds.js";
import { getResults } from "../functions/getResults.js";
import { indexName } from "../functions/indexName.js";
import { logError } from "../functions/logger.js";
import { lookupAlternateIds } from "../functions/lookupAlternateIds.js";
import { parseFields } from "../functions/parseFields.js";
import { queryParams } from "../reports/queryParams.js";
import { setExclusions } from "../functions/setExclusions.js";
import setSortBy from "../reports/setSortBy.js";
import { v4 as uuidv4 } from "uuid";

const replaceSearchIds = async (params) => {
  let { query } = params;
  if (typeof query !== "string") {
    return "";
  }
  let index = indexName({ ...params });
  let match = query.match(/tax_\w+\(\s*([^\)]+\s*)/);
  if (match) {
    let ids = match.slice(1);
    if (ids.length > 0) {
      let altIds = await lookupAlternateIds({ recordId: ids, index });
      if (altIds.length == ids.length) {
        for (let i = 0; i < altIds.length; i++) {
          let altId = altIds[i].replace("taxon-", "");
          query = query.replace(`(${ids[i]})`, `(${altId})`);
        }
      }
    }
  }

  return query;
};

const formattedResponse = async (req, res, response) => {
  res.format({
    json: () => {
      let { filename, indent } = req.query;
      if (typeof filename === "string") {
        filename = `${filename.replace(/\.json$/, "")}.json`;
        res.attachment(filename);
      }
      if (typeof indent !== "number" || indent.match(/^\d+$/)) {
        indent = 4;
      }
      res.status(200).send(formatJson(response, indent));
    },
    csv: async () => {
      let opts = {
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
      let csv = await formatCsv(response, opts);
      if (req.query.filename) {
        let filename = `${req.query.filename.replace(/\.csv$/, "")}.csv`;
        res.attachment(filename);
      }
      res.status(200).send(csv);
    },

    tsv: async () => {
      let opts = {
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
      let tsv = await formatCsv(response, opts);
      if (req.query.filename) {
        let filename = `${req.query.filename.replace(/\.tsv$/, "")}.tsv`;
        res.attachment(filename);
      }
      res.status(200).send(tsv);
    },
  });
};

export const getSearchResults = async (req, res) => {
  try {
    let response = {};
    let exclusions = setExclusions(req.query);
    let sortBy = setSortBy(req.query);
    let {
      query,
      queryId,
      persist,
      fieldOpts,
      result,
      taxonomy,
      rank = "species",
      size,
    } = req.query;
    let bounds = {};
    if (fieldOpts) {
      for (let entry of fieldOpts) {
        let [field, opts] = entry.split(":");

        let { params, summaries } = await queryParams({
          term: query,
          result,
          rank,
          taxonomy,
        });
        let exclusions = setExclusions(params);
        bounds[field] = await getBounds({
          params,
          fields: [field],
          summaries,
          result,
          exclusions,
          taxonomy,
          apiParams: params,
          opts,
        });
      }
    }
    let progress = getProgress(queryId);
    let uuid;
    if (queryId) {
      if (progress && progress.uuid) {
        try {
          if (!isProgressComplete(queryId)) {
            return res.status(202).send();
          }
          response = await cachedResponse({
            url: progress.uuid,
            persist,
            queryId,
          });
          if (Object.keys(response).length == 0) {
            return res.status(202).send();
          }
          return await formattedResponse(req, res, response);
        } catch (message) {
          logError({ req, message });
        }
      } else if (persist && (await pingCache())) {
        uuid = uuidv4();
      }
    }
    let countRes = {};
    if (queryId || size > 1000) {
      countRes = await getResults({
        ...req.query,
        exclusions,
        size: 0,
        bounds,
      });
      if (queryId && countRes.status && countRes.status.hits) {
        setProgress(queryId, { total: countRes.status.hits, persist, uuid });
      }
    }
    response = await getResults({
      ...req.query,
      exclusions,
      sortBy,
      countValues: true,
      req,
      bounds,
      aggregations: countRes.aggs,
    });
    if (!response.status.success) {
      return res.status(200).send({ status: response.status });
    }
    if (response.status.hits == 0) {
      let query = await replaceSearchIds(req.query);
      if (query != req.query.query) {
        if (countRes) {
          countRes = await getResults({
            ...req.query,
            exclusions,
            size: 0,
            bounds,
          });
          if (countRes.status && countRes.status.hits) {
            setProgress(queryId, { total: countRes.status.hits });
          }
        }
        response = await getResults({
          ...req.query,
          query,
          exclusions,
          sortBy,
          req,
          bounds,
          aggregations: countRes.aggs,
        });
        response.queryString = query;
      }
    }
    if (countRes.aggs && !response.aggs) {
      response.aggs = countRes.aggs;
    }
    progress = getProgress(queryId);
    if (
      progress &&
      progress.persist &&
      progress.uuid &&
      progress.disconnected
    ) {
      try {
        await cacheStore({ url: progress.uuid }, response);
      } catch (message) {
        logError({ req, message });
      }
      return res.status(200).send({ status: "ready" });
    }
    let fResponse = await formattedResponse(req, res, response);
    clearProgress(queryId);
    return fResponse;
  } catch (message) {
    logError({ req, message });
    return res.status(400).send({ status: "error" });
  }
};
