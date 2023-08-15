import { clearProgress, setProgress } from "../functions/progress";

import { formatCsv } from "../functions/formatCsv";
import { formatJson } from "../functions/formatJson";
import { getResults } from "../functions/getResults";
import { indexName } from "../functions/indexName";
import { logError } from "../functions/logger";
import { lookupAlternateIds } from "../functions/lookupAlternateIds";
import { parseFields } from "../functions/parseFields";
import { setExclusions } from "../functions/setExclusions";
import setSortBy from "../reports/setSortBy";

const replaceSearchIds = async (params) => {
  let query = params.query;
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

export const getSearchResults = async (req, res) => {
  try {
    let response = {};
    let exclusions = setExclusions(req.query);
    let sortBy = setSortBy(req.query);
    let queryId = req.query.queryId;
    if (queryId) {
      let countRes = await getResults({ ...req.query, exclusions, size: 0 });
      if (countRes.status && countRes.status.hits) {
        setProgress(queryId, { total: countRes.status.hits });
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
    clearProgress(queryId);
    return res.format({
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
  } catch (message) {
    logError({ req, message });
    return res.status(400).send({ status: "error" });
  }
};
