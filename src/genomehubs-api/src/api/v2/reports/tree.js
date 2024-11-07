import { getProgress, setProgress } from "../functions/progress.js";

import { aInB } from "../functions/aInB.js";
import { attrTypes } from "../functions/attrTypes.js";
import { combineQueries } from "../functions/combineQueries.js";
import { config } from "../functions/config.js";
import { getBounds } from "./getBounds.js";
import { getResults } from "../functions/getResults.js";
import parseCatOpts from "../functions/parseCatOpts.js";
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

const getLCA = async ({
  params,
  fields,
  summaries,
  result,
  taxonomy,
  exclusions,
  apiParams,
}) => {
  params.size = 1;
  params.aggs = {
    by_lineage: {
      nested: {
        path: "lineage",
      },
      aggs: {
        ancestors: {
          terms: { field: "lineage.taxon_id", size: 100 },
          aggs: {
            types_count: { value_count: { field: "lineage.taxon_id" } },
            min_depth: {
              min: { field: "lineage.node_depth" },
            },
            max_depth: {
              max: { field: "lineage.node_depth" },
            },
            ancestor_bucket_sort: {
              bucket_sort: {
                sort: [
                  { types_count: { order: "desc" } },
                  { min_depth: { order: "asc" } },
                ],
                size: 2,
              },
            },
          },
        },
      },
    },
  };
  let { query } = params;
  for (let [p, v] of Object.entries(apiParams)) {
    if (p.match(/query[A-Z]$/)) {
      params[p] = v;
    }
  }
  let maxDepth;
  let taxon;
  if (query) {
    let match = query.match(/tax_tree\((.+?)\)/);
    if (match) {
      maxDepth = 100;
      taxon = match[1];
    }
  }
  let res = await getResults({
    ...params,
    taxonomy,
    fields,
    query,
    exclusions,
    maxDepth: 100,
    lca: { maxDepth: 100 },
  });
  if (!res.status.success) {
    return {};
  }

  let buckets;
  try {
    buckets = res.aggs.by_lineage.ancestors.buckets;
  } catch (err) {
    {
      let filtered = query.split(/\s+(?:AND|and)\s+/);
      if (query.match("tax_depth")) {
        filtered = filtered.filter((term) => !term.startsWith("tax_depth"));
      }
      res = await getResults({
        ...params,
        taxonomy,
        fields,
        query: filtered.join(" AND "),
        exclusions,
        maxDepth: 100,
        lca: { maxDepth: 100 },
      });
      if (!res.status.success) {
        return {};
      }
      if (!res.aggs) {
        return {};
      }
      buckets = res.aggs.by_lineage.ancestors.buckets;
    }
  }
  let bucket;
  let lca;
  if (buckets.length >= 1) {
    bucket = buckets[0];
    let maxDepth = bucket.max_depth.value;
    let minDepth = bucket.min_depth.value;
    let taxon_id = bucket.key;
    let parent;

    let child;
    let depthChange = 0;
    for (let ancestor of res.results[0].result.lineage) {
      depthChange++;
      if (ancestor.taxon_id == taxon_id) {
        depthChange = 0;
      }
      if (taxon) {
        if (ancestor.taxon_id == taxon || ancestor.scientific_name == taxon) {
          minDepth += depthChange;
          maxDepth += depthChange;
          taxon_id = ancestor.taxon_id;
          child = taxon_id;
        } else if (child) {
          parent = ancestor.taxon_id;
          break;
        }
      } else if (child) {
        parent = ancestor.taxon_id;
        break;
      } else if (taxon_id == ancestor.taxon_id) {
        child = taxon_id;
      }
    }
    // }

    lca = {
      taxon_id,
      count: bucket.doc_count,
      maxDepth: result == "taxon" ? maxDepth : maxDepth + 1,
      minDepth,
      parent,
    };
  }
  return lca;
};

const chunkArray = (arr, chunkSize) => {
  if (chunkSize <= 0) {
    throw "Invalid chunk size";
  }
  let chunks = [];
  for (let i = 0, len = arr.length; i < len; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
};

// TODO: tune chunkSize parameter
const chunkSize = 100;

const addXResultsToTree = async ({
  xRes,
  treeNodes,
  optionalFields,
  lca,
  xQuery,
  update,
  yRes,
  ancStatus,
  queryId,
  taxonomy,
  catRank,
  index,
}) => {
  let isParentNode = {};
  let lineages = {};
  if (!ancStatus) {
    ancStatus = new Set();
  }

  for (let result of xRes.results) {
    let treeFields;
    let source;
    if (result.result.fields) {
      treeFields = {};
      for (let f of optionalFields) {
        if (result.result.fields[f]) {
          let {
            aggregation_source: source,
            value,
            min,
            max,
            range,
          } = result.result.fields[f];
          treeFields[f] = {
            source,
            value,
            ...(min && { min }),
            ...(max && { max }),
          };
        }
      }
    }
    let taxonId = result.result.taxon_id;
    if (update) {
      if (treeFields) {
        treeNodes[taxonId].fields = treeFields;
        treeNodes[taxonId].status = ancStatus.has(taxonId) ? 1 : 0;
      }
      continue;
    } else {
      let { assembly_id, taxon_rank, scientific_name, parent, lineage } =
        result.result;

      if (!treeNodes[taxonId]) {
        treeNodes[taxonId] = {
          count: 0,
          children: {},
          taxon_id: taxonId,
          scientific_name,
          taxon_rank,
          ...(index == "taxon" && treeFields && { fields: treeFields }),
          ...(catRank && taxon_rank == catRank && { cat: taxonId }),
        };
        isParentNode[parent] = true;
        lineages[taxonId] = [
          ...lineage.map((obj) => ({ ...obj, node_depth: obj.node_depth + 1 })),
        ];
      }

      if (assembly_id) {
        treeNodes[taxonId].children = {
          ...treeNodes[taxonId].children,
          [assembly_id]: true,
        };
        isParentNode[taxonId] = true;
        treeNodes[taxonId].count += 1;
        treeNodes[taxonId].hasAssemblies = true;
        treeNodes[assembly_id] = {
          count: 1,
          children: {},
          taxon_id: assembly_id,
          scientific_name: assembly_id,
          taxon_rank: "assembly",
          ...(treeFields && { fields: treeFields }),
          ...(catRank && taxon_rank == catRank && { cat: taxonId }),
        };
        // isParentNode[taxonId] = true;
        lineages[assembly_id] = [
          {
            taxon_id: assembly_id,
            taxon_rank: "assembly",
            scientific_name: assembly_id,
            node_depth: 0,
          },
          ...lineage.map((obj) => ({ ...obj, node_depth: obj.node_depth + 1 })),
        ];
      }
    }
  }

  if (update) {
    return;
  }

  if (yRes) {
    let yCount = 0;
    for (let result of yRes.results) {
      let taxonId = result.result.taxon_id;
      if (!treeNodes[taxonId]) {
        continue;
      }
      yCount++;
      treeNodes[taxonId].status = 1;
    }
    lca.yCount = yCount;
  }

  let missingIds = new Set();

  for (let result of xRes.results) {
    let taxonId = result.result.taxon_id;
    let child = taxonId;
    let { status } = treeNodes[taxonId];

    let descIds = [child];
    if (!isParentNode[taxonId] || treeNodes[taxonId].hasAssemblies) {
      treeNodes[child].count = treeNodes[child].count || 1;
      if (lineages[taxonId]) {
        for (let ancestor of lineages[taxonId]) {
          let ancestorId = ancestor.taxon_id;
          if (ancestorId == child) {
            continue;
          }
          if (ancestorId == lca.parent) {
            break;
          }
          descIds.push(ancestorId);
          if (status) {
            // ancStatus.add(ancestorId);
          }
          if (!treeNodes[ancestorId]) {
            missingIds.add(ancestorId);
            treeNodes[ancestorId] = {
              count: 0,
              children: {},
              scientific_name: ancestor.scientific_name,
              taxon_rank: ancestor.taxon_rank,
              taxon_id: ancestorId,
            };
          }
          if (catRank && ancestor.taxon_rank == catRank) {
            for (let descId of descIds) {
              treeNodes[descId].cat = ancestorId;
            }
          }
          treeNodes[ancestorId].count += 1;
          treeNodes[ancestorId].children[child] = true;
          child = ancestorId;
          if (ancestorId == lca.taxon_id) {
            continue;
          }
        }
      }
    }
  }
  if (missingIds.size > 0) {
    let progress = getProgress(queryId);
    let { x } = progress;
    if (queryId) {
      setProgress(queryId, { total: progress.total + missingIds.size });
      progress = getProgress(queryId);
    }
    for (let chunk of chunkArray([...missingIds], chunkSize)) {
      progress = getProgress(queryId);
      let mapped = []; // xQuery.query.split(/\s+AND\s+/i);
      mapped = mapped.filter((term) => !term.startsWith("tax_"));
      mapped.unshift(`tax_eq(taxon_id:${chunk.join(",taxon_id:")})`);
      let newQuery = { ...xQuery, taxonomy, query: mapped.join(" AND ") };
      // TODO: review newQuery options
      let newRes = await getResults(newQuery);
      if (!newRes.status.success) {
        return { status: newRes.status };
      }
      await addXResultsToTree({
        xRes: newRes,
        treeNodes,
        optionalFields,
        lca,
        xQuery: newQuery,
        update: true,
        ancStatus,
        queryId,
        taxonomy,
        index,
      });
      x += chunkSize;
      setProgress(queryId, { x });
    }
  }
};

const collapseNodes = ({ taxonId, treeNodes, ancNode, depth = 0 }) => {
  if (!treeNodes[taxonId]) {
    return;
  }
  let children = Object.keys(treeNodes[taxonId].children);
  if (ancNode) {
    if (children.length == 1 && treeNodes[taxonId].taxon_rank != "species") {
      delete ancNode.children[taxonId];
      delete treeNodes[taxonId];
    } else {
      ancNode = treeNodes[taxonId];
      depth += 1;
    }
  } else {
    ancNode = treeNodes[taxonId];
  }
  let depths = [depth];
  for (let childId of children) {
    ancNode.children[childId] = true;
    depths.push(
      collapseNodes({
        taxonId: childId,
        treeNodes,
        ancNode,
        depth,
      })
    );
  }
  return Math.max(...depths);
};

const getTree = async ({
  params,
  x,
  y,
  yParams,
  fields,
  xFields,
  yFields,
  optionalFields,
  cat,
  result,
  treeThreshold = config.treeThreshold,
  queryId,
  catRank,
  taxonomy,
  collapseMonotypic,
  req,
  apiParams,
}) => {
  cat = undefined;
  let { lookupTypes } = await attrTypes({ result, taxonomy });
  // let field = yFields[0] || fields[0];
  let exclusions;
  params.excludeUnclassified = true;
  exclusions = setExclusions(params);
  let lca = await getLCA({
    params: { ...params },
    fields,
    taxonomy,
    exclusions,
    apiParams,
    result,
  });
  exclusions.missing = [...new Set(exclusions.missing.concat(xFields))];
  if (treeThreshold > -1 && lca.count > treeThreshold) {
    return {
      status: {
        success: false,
        error: `Trees currently limited to ${treeThreshold} nodes (x query returns ${lca.count} taxa).\nPlease specify additional filters to continue.`,
      },
    };
  }
  let { maxDepth } = lca;
  let mapped = params.query.split(/\s+(?:AND|and)\s+/);
  // mapped.push("bioproject");
  let yMapped = yParams.query.split(/\s+(?:AND|and)\s+/);
  // TODO: include descendant values when include estimates is false and minDepth > tax_depth
  let match = params.query.match(/tax_depth\s*\((.+?)\)/);
  if (match && match[1] > maxDepth) {
    return {
      lca,
      status: {
        success: false,
        error: `tax_depth greater than tree depth\nConsider reducing to 'tax_depth(${maxDepth})'`,
      },
    };
  }
  let yMatch = params.query.match(/tax_depth\s*\((.+?)\)/);
  if (yMatch && yMatch[1] > maxDepth) {
    return {
      lca,
      status: {
        success: false,
        error: `tax_depth greater than tree depth\nConsider reducing to 'tax_depth(${maxDepth})'`,
      },
    };
  }

  // let res = await getResults({
  //   ...params,
  //   taxonomy,
  //   fields: [],
  //   query,
  //   exclusions,
  //   maxDepth: 100,
  //   lca: { maxDepth: 100 },
  // });
  let xQuery = {
    ...params,
    query: mapped.join(" AND "),
    size: treeThreshold, // lca.count,
    // maxDepth,
    lca,
    fields,
    // ranks: ranks.join(","),
    optionalFields,
    exclusions,
  };
  if (!xQuery.query) {
    xQuery.query = xQuery.x;
  }
  for (let [p, v] of Object.entries(apiParams)) {
    if (p.match(/query[A-Z]$/)) {
      xQuery[p] = v;
    }
  }
  if (queryId) {
    setProgress(queryId, { total: lca.count });
  }
  let xRes = await getResults({ ...xQuery, taxonomy, req, update: "x" });
  if (!xRes.status.success) {
    return { status: xRes.status };
  }

  let yRes;
  if (y) {
    yParams.excludeMissing.push(...yFields);
    let catField;
    catField = (cat || "").replace(/[^\w_-].+$/, "");
    let catMeta = lookupTypes(catField);
    if (catMeta) {
      yParams.excludeMissing.push(catMeta.name);
    }
    yParams.excludeMissing = [...new Set(yParams.excludeMissing)];
    yParams.excludeUnclassified = true;
    exclusions = setExclusions(yParams);
    for (let [p, v] of Object.entries(apiParams)) {
      if (p.match(/query[A-Z]$/)) {
        yParams[p] = v;
      }
    }
    yRes = await getResults({
      ...yParams,
      taxonomy,
      query: yMapped.join(" AND "),
      size: treeThreshold, // lca.count,
      maxDepth,
      fields: yFields,
      exclusions,
      req,
      update: "y",
    });
    if (!yRes.status.success) {
      return { status: yRes.status };
    }
  }
  let treeNodes = {};
  await addXResultsToTree({
    xRes,
    treeNodes,
    optionalFields,
    lca,
    xQuery,
    yRes,
    queryId,
    taxonomy,
    catRank,
    index: result,
  });

  if (
    lca.taxon_id &&
    !treeNodes[lca.taxon_id] &&
    treeNodes[lca.taxon_id.toUpperCase()]
  ) {
    lca.taxon_id = lca.taxon_id.toUpperCase();
  }
  if (collapseMonotypic) {
    maxDepth = collapseNodes({ taxonId: lca.taxon_id, treeNodes });
  }

  return { lca: { ...lca, maxDepth }, treeNodes };
};

export const tree = async ({
  x,
  y,
  cat,
  result,
  taxonomy,
  yOpts,
  apiParams,
  req,
}) => {
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
  let catOpts, catMeta;

  let fields;
  let catRank;
  if (cat) {
    ({
      cat,
      catOpts,
      query: params.query,
      catMeta,
    } = parseCatOpts({
      cat,
      query: params.query,
      searchFields,
      lookupTypes,
    }));
    let catField;
    catField = cat.replace(/[^\w_-].+$/, "");
    // catMeta = lookupTypes(catField);
    if (catMeta) {
      fields = [...new Set(xFields.concat([catMeta.name]))];
    } else {
      catRank = catField.replace(/\+/, "");
      fields = [...new Set(xFields)];
    }
  } else {
    fields = [...new Set(xFields)];
  }
  fields = [...new Set(fields.concat(searchFields))];

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

  let treeThreshold = apiParams.treeThreshold || config.treeThreshold;
  if (treeThreshold < 0) {
    treeThreshold = 100000;
  }
  let bounds;
  let exclusions = setExclusions(params);
  let boundFields = xFields
    .concat(yFields)
    .filter(
      (field) => lookupTypes(field) && lookupTypes(field).type != "keyword"
    );
  bounds = await getBounds({
    params: { ...params },
    fields: boundFields,
    summaries,
    result,
    exclusions,
    taxonomy,
    apiParams,
    //opts: xOpts,
  });
  if (!bounds) {
    bounds = {};
  }
  let yBounds;
  if (y) {
    yBounds = await getBounds({
      params: { ...params },
      fields: yFields.filter(
        (field) => lookupTypes(field) && lookupTypes(field).type != "keyword"
      ),
      summaries,
      result,
      exclusions,
      taxonomy,
      apiParams,
      opts: yOpts,
    });
  }
  let catBounds;
  if (cat) {
    catBounds = await getBounds({
      params: { ...params },
      fields: [catMeta.name, ...boundFields],
      summaries: ["value", ...summaries],
      cat,
      result,
      exclusions,
      taxonomy,
      apiParams,
      opts: catOpts,
      catOpts,
    });
  }

  if (cat && catBounds) {
    bounds.cat = catBounds.cat;
    bounds.cats = catBounds.cats;
    bounds.catType = catBounds.catType;
    bounds.catCount = catBounds.tickCount;
    bounds.by = catBounds.by;
    bounds.showOther = catBounds.showOther;
    if (yBounds) {
      yBounds.cat = catBounds.cat;
      yBounds.cats = catBounds.cats;
      yBounds.catType = catBounds.catType;
      yBounds.catCount = catBounds.tickCount;
      yBounds.by = catBounds.by;
      yBounds.showOther = catBounds.showOther;
    }
  }
  let tree = status
    ? {}
    : await getTree({
        params,
        fields,
        xFields,
        optionalFields,
        catRank,
        summaries,
        cat: (catMeta && catMeta.name) || cat,
        x,
        y,
        yParams,
        yFields,
        ySummaries,
        result,
        treeThreshold,
        queryId: apiParams.queryId,
        collapseMonotypic: apiParams.collapseMonotypic,
        req,
        taxonomy,
        apiParams,
      });
  if (tree && tree.status && tree.status.success == false) {
    status = { ...tree.status };
    tree = {};
  }

  return {
    status: status || { success: true },
    report: {
      status,
      tree,
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
      x: tree.lca ? tree.lca.count : 0,
      ...(y && { y: tree.lca && tree.lca.yCount ? tree.lca.yCount : 0 }),
    },
    xQuery,
    ...(y && { yQuery }),
    xLabel: fields[0],
    ...(y && { yLabel: yFields[0] }),
  };
};
