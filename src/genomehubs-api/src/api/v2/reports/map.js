import { getProgress, setProgress } from "../functions/progress";

import { aInB } from "../functions/aInB";
import { attrTypes } from "../functions/attrTypes";
import { combineQueries } from "../functions/combineQueries";
import { config } from "../functions/config";
import { getBounds } from "./getBounds";
import { getResults } from "../functions/getResults";
import { parseFields } from "../functions/parseFields";
import { queryParams } from "./queryParams";
import { setExclusions } from "../functions/setExclusions";

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
  y,
  yParams,
  fields,
  yFields,
  cat,
  result,
  queryId,
  catRank,
  mapThreshold = config.mapThreshold || 1000,
  taxonomy,
  req,
}) => {
  console.log(0);
  cat = undefined;
  console.log(x);
  let { lookupTypes } = await attrTypes({ result, taxonomy });
  // let field = yFields[0] || fields[0];
  let exclusions;
  exclusions = setExclusions(params);

  let xQuery = {
    ...params,
    query: x,
    size: mapThreshold, // lca.count,
    fields,
    exclusions,
  };
  // if (queryId) {
  //   setProgress(queryId, { total: lca.count });
  // }
  let xRes = await getResults({ ...xQuery, taxonomy, req, update: "x" });
  if (!xRes.status.success) {
    return { status: xRes.status };
  }

  console.log(xRes);

  // let yRes;
  // if (y) {
  //   yParams.excludeMissing.push(...yFields);
  //   let catMeta = lookupTypes(cat);
  //   if (catMeta) {
  //     yParams.excludeMissing.push(catMeta.name);
  //   }
  //   yParams.excludeMissing = [...new Set(yParams.excludeMissing)];
  //   yParams.excludeUnclassified = true;
  //   exclusions = setExclusions(yParams);
  //   yRes = await getResults({
  //     ...yParams,
  //     taxonomy,
  //     query: yMapped.join(" AND "),
  //     size: treeThreshold, // lca.count,
  //     maxDepth,
  //     fields: yFields,
  //     exclusions,
  //     req,
  //     update: "y",
  //   });
  //   if (!yRes.status.success) {
  //     return { status: yRes.status };
  //   }
  // }
  // let treeNodes = {};
  // await addXResultsToTree({
  //   xRes,
  //   treeNodes,
  //   optionalFields,
  //   lca,
  //   xQuery,
  //   yRes,
  //   queryId,
  //   taxonomy,
  //   catRank,
  // });

  // if (
  //   lca.taxon_id &&
  //   !treeNodes[lca.taxon_id] &&
  //   treeNodes[lca.taxon_id.toUpperCase()]
  // ) {
  //   lca.taxon_id = lca.taxon_id.toUpperCase();
  // }
  // if (collapseMonotypic) {
  //   maxDepth = collapseNodes({ taxonId: lca.taxon_id, treeNodes });
  // }

  return {};
};

export const map = async ({ x, y, cat, result, taxonomy, apiParams, req }) => {
  let { typesMap, lookupTypes } = await attrTypes({ result, taxonomy });
  let searchFields = await parseFields({
    result,
    fields: apiParams.fields,
    taxonomy,
  });
  let {
    params,
    fields: xFields,
    summaries,
  } = await queryParams({
    term: x,
    result,
    taxonomy,
  });
  let fields;
  let catRank;
  if (cat) {
    let catField;
    catField = cat.replace(/[^\w_-].+$/, "");
    let catMeta = lookupTypes(catField);
    if (catMeta) {
      fields = [...new Set(searchFields.concat([catMeta.name]))];
    } else {
      catRank = catField;
      fields = [...new Set(searchFields)];
    }
  } else {
    fields = [...new Set(searchFields)];
  }
  fields = [...new Set(["sample_location", ...searchFields])];

  let status;
  if (!x || !aInB(fields, Object.keys(typesMap))) {
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

  let treeThreshold = `${apiParams.treeThreshold}` || config.treeThreshold;
  if (treeThreshold < 0) {
    treeThreshold = 100000;
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
  console.log(params.query);
  console.log(status);
  let map = status
    ? {}
    : await getMap({
        params,
        fields,
        catRank,
        summaries,
        cat,
        x,
        y,
        yParams,
        yFields,
        ySummaries,
        result,
        queryId: apiParams.queryId,
        req,
        taxonomy,
      });
  console.log(1);
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
