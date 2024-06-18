import { cacheFetch, cacheStore, cachedResponse } from "../functions/cache";
import {
  clearProgress,
  getProgress,
  progressComplete,
  setProgress,
} from "../functions/progress";

import { formatCsv } from "../functions/formatCsv";
import { formatJson } from "../functions/formatJson";
import { getResults } from "../functions/getResults";
import { indexName } from "../functions/indexName";
import { logError } from "../functions/logger";
import { lookupAlternateIds } from "../functions/lookupAlternateIds";
import { parseFields } from "../functions/parseFields";
import { setExclusions } from "../functions/setExclusions";
import setSortBy from "../reports/setSortBy";
import { v4 as uuidv4 } from "uuid";

const replaceSearchIds = async (params) => {
  let { query } = params;
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
      if (req.query.filename) {
        let filename = `${req.query.filename.replace(/\.json$/, "")}.json`;
        res.attachment(filename);
      }
      res.status(200).send(formatJson(response, req.query.indent));
    },
    csv: async () => {
      let opts = {
        delimiter: ",",
        fields: await parseFields({ ...req.query }),
        names: req.query.names ? req.query.names.split(/\s*,\s*/) : [],
        ranks: req.query.ranks ? req.query.ranks.split(/\s*,\s*/) : [],
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
        names: req.query.names ? req.query.names.split(/\s*,\s*/) : [],
        ranks: req.query.ranks ? req.query.ranks.split(/\s*,\s*/) : [],
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
    let { queryId, persist } = req.query;
    let progress = getProgress(queryId);
    if (queryId) {
      if (
        progress &&
        (progress.disconnected || progress.disconnected) &&
        progress.uuid
      ) {
        try {
          if (!progress.complete) {
            await progressComplete(queryId);
          }
          if (progress.complete) {
            response = await cachedResponse({ url: progress.uuid, persist });
          }
          if (Object.keys(response).length == 0) {
            return res.status(202).send();
          }
          return await formattedResponse(req, res, response);
        } catch (message) {
          logError({ req, message });
        }
      } else if (persist) {
        setProgress(queryId, { persist, uuid: uuidv4() });
      }
      let countRes = await getResults({ ...req.query, exclusions, size: 0 });
      if (countRes.status && countRes.status.hits) {
        setProgress(queryId, { total: countRes.status.hits, persist });
      }
    }
    response = await getResults({
      ...req.query,
      exclusions,
      sortBy,
      countValues: true,
      req,
    });
    if (!response.status.success) {
      return res.status(200).send({ status: response.status });
    }
    if (response.status.hits == 0) {
      let query = await replaceSearchIds(req.query);
      if (query != req.query.query) {
        let countRes = await getResults({ ...req.query, exclusions, size: 0 });
        if (countRes.status && countRes.status.hits) {
          setProgress(queryId, { total: countRes.status.hits });
        }
        response = await getResults({
          ...req.query,
          query,
          exclusions,
          sortBy,
          req,
        });
        response.queryString = query;
      }
    }
    progress = getProgress(queryId);
    if (progress && progress.persist && progress.disconnected) {
      try {
        console.log("storing cache");
        console.log(progress.uuid);
        await cacheStore({ url: progress.uuid }, response);
      } catch (message) {
        console.log("error");
        console.log(message);
        logError({ req, message });
      }
    }
    console.log({ returnResponse: code });
    return await formattedResponse(req, res, response);
  } catch (message) {
    logError({ req, message });
    console.log({ returnError: code });
    return res.status(400).send({ status: "error" });
  }
};
