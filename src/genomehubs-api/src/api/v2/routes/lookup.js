import { checkResponse } from "../functions/checkResponse";
import { client } from "../functions/connection";
import { formatJson } from "../functions/formatJson";
import { indexName } from "../functions/indexName";
import { logError } from "../functions/logger";
import { lookupQuery } from "../queries/lookupQuery";
import { processHits } from "../functions/processHits";
import { saytQuery } from "../queries/saytQuery";
import { suggestQuery } from "../queries/suggestQuery";

const indices = {
  taxon: "taxon_id",
  assembly: "assembly",
  analysis: "analysis",
  feature: "feature",
  // file: "file",
};

const setResult = (iter) => {
  /**
   * Set result index for multi queries.
   * @param {Number} iter - Iterator to keep track of recursive function calls.
   */
  let keys = Object.keys(indices);
  if (iter < keys.length) {
    return keys[iter];
  }
  return false;
};

const sayt = async (params, iter = 0) => {
  /**
   * Lookup using search-as-you-type fields.
   * @param {Object} params - Query parameters.
   * @param {string} params.result - The index type.
   * @param {string} params.searchTerm - The search term to look up.
   * @param {Number} iter - Iterator to keep track of recursive function calls.
   */
  let result = params.result;
  if (result == "multi") {
    result = setResult(iter);
    if (!result) return { status: undefined, results: [] };
  }
  let newParams = { ...params, result };
  if (result == "taxon" && params.searchTerm.match(/\s/)) {
    if (params.searchTerm.match(/\*/)) {
      newParams.wildcardTerm = params.searchTerm;
    } else {
      let parts = params.searchTerm.split(/\s+/);
      if (parts.length == 2) {
        newParams.wildcardTerm = `${parts.join(" * ")}*`;
      }
    }
  } else if (params.searchTerm.match(/\*/)) {
    newParams.wildcardTerm = params.searchTerm;
  }
  let index = indexName(newParams);
  const { body } = await client
    .search(
      {
        index,
        body: saytQuery({ ...newParams }),
        rest_total_hits_as_int: true,
      },
      { meta: true }
    )
    .catch((err) => {
      return err.meta;
    });
  let results = [];
  let status = checkResponse({ body });
  status.result = result;
  if (status.hits && status.hits > 0) {
    results = processHits({ body, reason: true });
  } else if (params.result == "multi") {
    iter++;
    let updated = await sayt(params, iter);
    status = updated.status;
    results = updated.results;
  }
  return { status, results };
};

const lookup = async (params, iter = 0) => {
  /**
   * Lookup using search-as-you-type fields.
   * @param {Object} params - Query parameters.
   * @param {string} params.result - The index type.
   * @param {string} params.searchTerm - The search term to look up.
   * @param {Number} iter - Iterator to keep track of recursive function calls.
   */
  let result = params.result;
  if (result == "multi") {
    result = setResult(iter);
    if (!result) return { status: undefined, results: [] };
  }
  let newParams = { ...params, result };
  let index = indexName(newParams);
  const { body } = await client
    .search(
      {
        index,
        body: lookupQuery({ ...newParams }),
        rest_total_hits_as_int: true,
      },
      { meta: true }
    )
    .catch((err) => {
      return err.meta;
    });
  let results = [];
  let status = checkResponse({ body });
  status.result = result;
  if (status.hits && status.hits > 0) {
    results = processHits({ body, reason: true });
  } else if (params.result == "multi") {
    iter++;
    let updated = await lookup(params, iter);
    status = updated.status;
    results = updated.results;
  }
  return { status, results };
};

const suggest = async (params, iter = 0) => {
  let result = params.result;
  if (result == "multi") {
    result = setResult(iter);
    if (!result) return { status: undefined, results: [] };
  }
  let newParams = { ...params, result };
  let index = indexName(newParams);
  const { body } = await client
    .search(
      {
        index,
        body: suggestQuery({ ...newParams }),
        rest_total_hits_as_int: true,
      },
      { meta: true }
    )
    .catch((err) => {
      return err.meta;
    });
  let suggestions = [];
  let status = checkResponse({ body });
  if (status.success && body.suggest) {
    body.suggest.simple_phrase.forEach((suggestion) => {
      suggestion.options.forEach((option) => {
        if (option.collate_match) {
          suggestions.push({
            text: suggestion.text,
            suggestion: { ...option },
          });
        }
      });
    });
  }
  if (params.result == "multi" && suggestions.length == 0) {
    iter++;
    let updated = await suggest(params, iter);
    status = updated.status;
    suggestions = updated.suggestions;
  }
  return { status, suggestions };
};

export const getIdentifiers = async (req, res) => {
  try {
    let response = {};
    response = await sayt(req.query);
    if (
      !response.status ||
      !response.status.success ||
      response.status.hits == 0
    ) {
      response = await lookup(req.query);
    }
    if (
      !response.status ||
      !response.status.success ||
      response.status.hits == 0
    ) {
      response = await suggest(req.query);
    }
    if (!response.status) {
      response = { status: { success: true, hits: 0 }, results: [] };
    }
    return res.status(200).send(formatJson(response, req.query.indent));
  } catch (message) {
    logError({ req, message });
    return res.status(400).send({ status: "error" });
  }
};
