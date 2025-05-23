import { getProgress, setProgress } from "../functions/progress.js";

import { aInB } from "../functions/aInB.js";
import { attrTypes } from "../functions/attrTypes.js";
import { combineQueries } from "../functions/combineQueries.js";
import { config } from "../functions/config.js";
import { getBounds } from "./getBounds.js";
import { getResultCount } from "../functions/getResultCount.js";
import { getResults } from "../functions/getResults.js";
import { parseFields } from "../functions/parseFields.js";
import { queryParams } from "./queryParams.js";
import { setExclusions } from "../functions/setExclusions.js";

const valueTypes = {
  long: "integer",
  integer: "integer",
  short: "integer",
  byte: "integer",
  date: "date",
  keyword: "keyword",
};

const getMap = async ({
  params,
  x,
  field = "sample_location",
  y,
  yParams,
  fields,
  yFields,
  cat,
  bounds,
  yBounds,
  result,
  queryId,
  catRank,
  mapThreshold = 1000,
  taxonomy,
  req,
  apiParams,
}) => {
  let { lookupTypes } = await attrTypes({ result, taxonomy });
  // let field = yFields[0] || fields[0];
  let exclusions;
  exclusions = setExclusions(params);

  let xQuery = {
    ...params,
    // query: x,
    fields,
    exclusions,
  };
  for (let [p, v] of Object.entries(apiParams)) {
    if (p.match(/query[A-Z]$/)) {
      xQuery[p] = v;
    }
  }
  if (bounds.cat) {
    if (bounds.by == "attribute") {
      if (!bounds.showOther) {
        xQuery.query += ` AND ${bounds.cat}=${bounds.cats
          .map(({ key }) => key)
          .join(",")}`;
      }
      xQuery.fields = [...new Set([...xQuery.fields, bounds.cat])];
    } else {
      xQuery.ranks = bounds.cat;
    }
  }
  let countRes = await getResultCount(xQuery);
  if (!countRes.status.success) {
    return { status: countRes.status };
  }
  let { count } = countRes;
  if (mapThreshold > -1 && count > mapThreshold) {
    return {
      status: {
        success: false,
        error: `Maps currently limited to ${mapThreshold} results (x query returns ${count}).\nPlease specify additional filters to continue.`,
      },
    };
  }
  // if (queryId) {
  //   setProgress(queryId, { total: lca.count });
  // }
  let xRes = await getResults({
    ...xQuery,
    size: count,
    taxonomy,
    req,
    // update: "x",
  });
  if (!xRes.status.success) {
    return { status: xRes.status };
  }

  let cats;
  if (bounds.cats) {
    cats = new Set(bounds.cats.map(({ key }) => key));
  }
  let rawData = {};
  for (let result of xRes.results) {
    let cat;
    if (bounds.cat) {
      if (bounds.by == "attribute") {
        cat = result.result.fields[bounds.cat].value.toLowerCase();
        if (Array.isArray(cat)) {
          cat = cat[0].toLowerCase();
        } else {
          cat = result.result.fields[bounds.cat].value.toLowerCase();
        }
      } else if (result.result.ranks) {
        cat = result.result.ranks[bounds.cat];
        if (cat) {
          cat = cat.taxon_id;
        }
      }
      if (!cat || !cats.has(cat)) {
        cat = "other";
      }
    }
    if (!cat) {
      cat = "all taxa";
    }
    if (!rawData[cat]) {
      rawData[cat] = [];
    }
    if (!result.result.fields[field]) {
      continue;
    }
    let coords = result.result.fields[field].value;
    let { aggregation_source } = result.result.fields[field];
    rawData[cat].push({
      ...(result.result.scientific_name && {
        scientific_name: result.result.scientific_name,
      }),
      ...(result.result.taxon_id && { taxonId: result.result.taxon_id }),
      ...(result.result.assembly_id && {
        assemblyId: result.result.assembly_id,
      }),
      ...(result.result.sample_id && { sampleId: result.result.sample_id }),
      coords,
      aggregation_source,
      cat,
    });
  }

  return { rawData };
};

export const map = async ({
  x,
  y,
  cat,
  rank,
  result,
  taxonomy,
  apiParams,
  fields,
  req,
}) => {
  let { typesMap, lookupTypes } = await attrTypes({ result, taxonomy });
  let searchFields = await parseFields({
    result,
    fields,
    taxonomy,
  });
  let {
    params,
    fields: xFields,
    summaries,
  } = await queryParams({
    term: x,
    result,
    rank,
    taxonomy,
  });
  let catRank;
  if (cat) {
    let catField;
    catField = cat.replace(/[^\w_-].+$/, "");
    let catMeta = lookupTypes(catField);
    if (catMeta) {
      xFields = [...new Set(searchFields.concat([catMeta.name]))];
    } else {
      catRank = catField;
      xFields = [...new Set(searchFields)];
    }
  } else {
    xFields = [...new Set(searchFields)];
  }
  xFields = [...new Set(["sample_location", ...searchFields])];
  fields = xFields;

  let status;
  if (!Object.keys(typesMap).includes("sample_location")) {
    status = {
      success: false,
      error: `no sample_location data available`,
    };
  } else if (!x || !aInB(xFields, Object.keys(typesMap))) {
    status = {
      success: false,
      error: `unknown field in 'x = ${x}'`,
    };
  }
  let yTerm = combineQueries(x, y);
  let {
    params: yParams,
    fields: yFields,
    summaries: ySummaries,
  } = await queryParams({
    term: yTerm,
    result,
    rank,
    taxonomy,
  });
  if (y && !aInB(yFields, Object.keys(typesMap))) {
    status = {
      success: false,
      error: `unknown field in 'y = ${y}'`,
    };
  }
  params.includeEstimates = apiParams.hasOwnProperty("includeEstimates")
    ? apiParams.includeEstimates
    : false;
  yParams.includeEstimates = params.includeEstimates;
  params.excludeDirect = apiParams.excludeDirect || [];
  params.excludeDescendant = apiParams.excludeDescendant || [];
  params.excludeAncestral = apiParams.excludeAncestral || [];
  params.excludeMissing = apiParams.excludeMissing || [];

  yParams.excludeDirect = apiParams.excludeDirect || [];
  yParams.excludeDescendant = apiParams.excludeDescendant || [];
  yParams.excludeAncestral = apiParams.excludeAncestral || [];
  yParams.excludeMissing = apiParams.excludeMissing || [];

  // if (params.includeEstimates) {
  //   delete params.excludeAncestral;
  //   delete yParams.excludeAncestral;
  // }

  // delete params.excludeDescendant;
  // delete yParams.excludeDescendant;

  let xQuery = { ...params };
  let yQuery = { ...yParams };

  let optionalFields = [...fields, ...yFields];
  if (apiParams.fields) {
    optionalFields = optionalFields.concat(apiParams.fields.split(","));
  }
  optionalFields = [...new Set([...optionalFields])];

  let mapThreshold = apiParams.mapThreshold || config.mapThreshold;
  if (mapThreshold < 0) {
    mapThreshold = 1000;
  }
  let bounds;
  let exclusions = setExclusions(params);
  bounds = await getBounds({
    params: { ...params },
    fields: xFields
      .concat(yFields)
      .filter(
        (field) => lookupTypes(field) && lookupTypes(field).type != "keyword"
      ),
    summaries,
    cat,
    result,
    exclusions,
    taxonomy,
    apiParams,
    //opts: xOpts,
  });
  if (!bounds) {
    status = {
      success: false,
      error: `no results contain sample_location data for the current query`,
    };
  }
  let yBounds;
  if (y) {
    yBounds = await getBounds({
      params: { ...params },
      fields: yFields.filter(
        (field) => lookupTypes(field) && lookupTypes(field).type != "keyword"
      ),
      summaries,
      cat,
      result,
      exclusions,
      taxonomy,
      apiParams,
      opts: yOpts,
    });
  }
  let map = status
    ? {}
    : await getMap({
        params,
        fields,
        catRank,
        summaries,
        cat,
        bounds,
        yBounds,
        x,
        y,
        yParams,
        yFields,
        ySummaries,
        result,
        mapThreshold,
        queryId: apiParams.queryId,
        req,
        taxonomy,
        apiParams,
      });
  if (map && map.status && map.status.success == false) {
    status = { ...map.status };
    map = {};
  }

  return {
    status: status || { success: true },
    report: {
      status,
      map,
      bounds,
      yBounds,
      xQuery: {
        ...xQuery,
        fields: optionalFields.join(","),
      },
      ...(y && {
        yQuery: {
          ...yQuery,
          fields: optionalFields.join(","),
          yFields,
        },
      }),
      // x: tree.lca ? tree.lca.count : 0,
      // ...(y && { y: tree.lca && tree.lca.yCount ? tree.lca.yCount : 0 }),
    },
    xQuery,
    ...(y && { yQuery }),
    xLabel: fields[0],
    ...(y && { yLabel: yFields[0] }),
  };
};
