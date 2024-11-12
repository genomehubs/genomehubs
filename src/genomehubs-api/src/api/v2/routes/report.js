import { cacheFetch, cacheStore, pingCache } from "../functions/cache.js";

import Archiver from "archiver";
import { JsonStreamStringify } from "json-stream-stringify";
import { aggregateNameClasses } from "../queries/aggregateNameClasses.js";
import { aggregateRanks } from "../queries/aggregateRanks.js";
import { aggregateRawValueSources } from "../queries/aggregateRawValueSources.js";
import { attrTypes } from "../functions/attrTypes.js";
import { checkResponse } from "../functions/checkResponse.js";
import { client } from "../functions/connection.js";
import { combineQueries } from "../functions/combineQueries.js";
import { files } from "../reports/files.js";
import { formatJson } from "../functions/formatJson.js";
import { getResultCount } from "../functions/getResultCount.js";
import { getResults } from "../functions/getResults.js";
import { histogram } from "../reports/histogram.js";
import { indexName } from "../functions/indexName.js";
import { logError } from "../functions/logger.js";
import { map } from "../reports/map.js";
import { oxford } from "../reports/oxford.js";
import { parseFields } from "../functions/parseFields.js";
import qs from "qs";
import { queryParams } from "../reports/queryParams.js";
import { setExclusions } from "../functions/setExclusions.js";
import { setRanks } from "../functions/setRanks.js";
import { tree } from "../reports/tree.js";

const plurals = (singular) => {
  const ranks = {
    genus: "genera",
    family: "families",
    order: "orders",
    class: "classes",
    phylum: "phyla",
    kingdom: "kingdoms",
    superkingdom: "superkingdoms",
  };
  return ranks[singular.toLowerCase()] || singular;
};

export const getFiles = async ({
  x,
  checkedFiles,
  taxonomy,
  queryString,
  fields,
  req,
  ...apiParams
}) => {
  // Return oxford plot results
  let status;
  let res = await files({
    x,
    checkedFiles,
    result: apiParams.result,
    taxonomy,
    fields,
    req,
    apiParams,
  });
  if (res.status.success == false) {
    if (!status) {
      status = res.status;
    }
  } else {
    status = { success: true };
  }
  let { report, xQuery } = res;
  let caption = "files report";
  return {
    status,
    report: {
      files: report,
      xQuery,
      queryString,
      caption,
    },
  };
};

export const getOxford = async ({
  x,
  y,
  cat,
  taxonomy,
  queryString,
  fields,
  reorient,
  req,
  ...apiParams
}) => {
  // Return oxford plot results
  let status;
  let res = await oxford({
    x,
    y,
    cat,
    result: apiParams.result,
    taxonomy,
    fields,
    reorient,
    req,
    apiParams,
  });
  if (res.status.success == false) {
    if (!status) {
      status = res.status;
    }
  } else {
    status = { success: true };
  }
  let { report, xLabel, xQuery, yLabel, yQuery } = res;
  let caption;
  if (report) {
    caption = `Oxford plot of ${x}${report.y ? ` against ${y}` : ""}`;
    if (cat) {
      caption += ` by ${cat.replace(/=.+$/, "")}`;
    }
  }
  return {
    status,
    report: {
      oxford: report,
      xQuery,
      // yQuery,
      xLabel,
      yLabel,
      queryString,
      caption,
    },
  };
};

export const getMap = async ({
  x,
  y,
  cat,
  rank,
  taxonomy,
  queryString,
  fields,
  req,
  ...apiParams
}) => {
  // Return map of results
  let status;
  let res = await map({
    x,
    y,
    cat,
    rank,
    result: apiParams.result,
    taxonomy,
    fields,
    req,
    apiParams,
  });
  if (res.status.success == false) {
    if (!status) {
      status = res.status;
    }
  } else {
    status = { success: true };
  }
  let { report, xLabel, xQuery, yQuery } = res;
  let caption;
  if (report) {
    caption = `Map of ${x}${report.y ? ` highlighting ${y}` : ""}`;
    if (cat) {
      caption += ` by ${cat.replace(/=.+$/, "")}`;
    }
  }
  return {
    status,
    report: {
      map: report,
      xQuery,
      // yQuery,
      xLabel,
      queryString,
      caption,
    },
  };
};

export const getTree = async ({
  x,
  y,
  cat,
  taxonomy,
  queryString,
  req,
  yOpts,
  ...apiParams
}) => {
  // Return tree of results
  let status;
  let res = await tree({
    x,
    y,
    cat,
    result: apiParams.result,
    taxonomy,
    req,
    yOpts,
    apiParams,
  });
  if (res.status.success == false) {
    if (!status) {
      status = res.status;
    }
  } else {
    status = { success: true };
  }
  let { report, xLabel, xQuery, yLabel, yQuery } = res;
  let caption;
  if (report) {
    caption = `Tree of ${x}${report.y ? ` highlighting ${y}` : ""}`;
    if (cat) {
      caption += ` by ${cat.replace(/[\+\[=].*/, "")}`;
    }
    if (apiParams.includeEstimates && report.xQuery.fields > "") {
      caption += ` including ancestrally derived estimates`;
    }
  }
  return {
    status,
    report: {
      tree: report,
      xQuery,
      yQuery,
      xLabel,
      queryString,
      caption,
    },
  };
};

export const scatterPerRank = async ({
  x,
  y,
  cat,
  rank,
  taxonomy,
  xOpts,
  yOpts,
  scatterThreshold = 100,
  queryString,
  table,
  ...apiParams
}) => {
  // Return 2D histogram at a list of ranks
  let ranks = rank ? setRanks(rank) : [undefined];
  let perRank = [];
  let xQuery;
  let yQuery;
  let xLabel;
  let yLabel;
  let status;
  for (rank of ranks.slice(0, 1)) {
    let res = await histogram({
      x,
      y,
      cat,
      rank,
      result: apiParams.result,
      taxonomy,
      xOpts,
      yOpts,
      scatterThreshold,
      report: table ? "table" : "scatter",
      apiParams,
    });
    if (res.status.success == false) {
      if (!status) {
        status = res.status;
      }
      perRank.push(res);
    } else {
      perRank.push(res.report);
      xQuery = res.xQuery;
      yQuery = res.yQuery;
      xLabel = res.xLabel;
      yLabel = res.yLabel;
    }
  }
  if (!status) {
    status = { success: true };
  }
  let report = perRank.length == 1 ? perRank[0] : perRank;
  let caption = `Distribution of ${y} with ${x}`;
  if (cat) {
    caption += ` by ${cat.replace(/[\+\[=].*/, "")}`;
  }
  if (apiParams.includeEstimates) {
    caption += ` including ancestrally derived estimates`;
  }
  return {
    status,
    report: {
      [apiParams.report]: report,
      xQuery,
      yQuery,
      xLabel,
      yLabel: yLabel || `Count of ${ranks[0]}`,
      queryString,
      caption,
    },
  };
};

export const histPerRank = async ({
  x,
  xOpts,
  cat,
  catToX,
  taxonomy,
  rank,
  queryString,
  ...apiParams
}) => {
  // Return histogram at a list of ranks
  let ranks = rank ? setRanks(rank) : [undefined];
  let perRank = [];
  let xQuery;
  let xLabel;
  let status;
  for (rank of ranks.slice(0, 1)) {
    let res = await histogram({
      x,
      xOpts,
      cat,
      catToX,
      rank,
      result: apiParams.result,
      taxonomy,
      scatterThreshold: 0,
      apiParams,
    });
    if (res.status.success == false) {
      if (!status) {
        status = res.status;
      }
      perRank.push(res);
    } else {
      perRank.push(res.report);
      xQuery = res.xQuery;
      xLabel = res.xLabel;
    }
  }
  if (!status) {
    status = { success: true };
  }
  let report = perRank.length == 1 ? perRank[0] : perRank;
  let caption = `Frequency distribution of ${ranks[0]}`;
  if (x) {
    caption += ` with ${x}`;
  }
  if (cat) {
    caption += ` by ${cat.replace(/[\+\[=].*/, "")}`;
  }
  if (apiParams.includeEstimates && apiParams.result == "taxon") {
    caption += ` including ancestrally derived estimates`;
  }
  return {
    status,
    report: {
      [apiParams.report]: report,
      valueType: report.valueType,
      xQuery,
      xLabel,
      yLabel: `Count${ranks[0] ? ` of ${ranks[0]}` : ""}`,
      queryString,
      caption,
    },
  };
};

export const tablePerRank = async ({
  x,
  y,
  cat,
  rank,
  taxonomy,
  xOpts,
  yOpts,
  queryString,
  ...apiParams
}) => {
  return scatterPerRank({
    x,
    y,
    cat,
    rank,
    taxonomy,
    xOpts,
    yOpts,
    scatterThreshold: 0,
    queryString,
    table: true,
    ...apiParams,
  });
};

export const arc = async ({
  x,
  y,
  z = y,
  result,
  taxonomy,
  rank,
  queryString,
  apiParams,
}) => {
  if (!x) {
    return {
      status: {
        success: false,
        error: `no x query specified`,
      },
    };
  }
  if (result == "taxon" && !rank) {
    return {
      status: {
        success: false,
        error: `no rank specified`,
      },
    };
  }
  let { params: zParams, fields: zFields } = await queryParams({
    term: z,
    result,
    taxonomy,
    rank,
  });
  let { params: yParams, fields: yFields } = await queryParams({
    term: y,
    result,
    taxonomy,
    rank,
  });
  zParams.includeEstimates = apiParams.hasOwnProperty("includeEstimates")
    ? apiParams.includeEstimates
    : false;
  yParams.includeEstimates = zParams.includeEstimates;

  let extraParams = {};
  for (let [p, v] of Object.entries(apiParams)) {
    if (p.match(/query[A-Z]$/)) {
      extraParams[p] = v;
    }
  }

  if (rank) {
    x.split(/\s+(?:and|AND)\s+/).forEach((term) => {
      if (!term.match("tax_")) {
        let field = term.replace(/[^\w_\(\)].+$/, "");
        if (field.match(/\(/)) {
          field = field.split(/[\(\)]/)[1];
        }
        yFields.push(field);
        zFields.push(field);
      }
    });
    if (yFields.length == 0) {
      yFields = [];
    }
    yFields = [...new Set(yFields)];
    (y || "").split(/\s+(?:and|AND)\s+/).forEach((term) => {
      if (!term.match("tax_")) {
        let field = term.replace(/[^\w_\(\)].+$/, "");
        if (field.match(/\(/)) {
          field = field.split(/[\(\)]/)[1];
        }
        zFields.push(field);
      }
    });
    if (zFields.length == 0) {
      zFields = [];
    }
    zFields = [...new Set(zFields)];
  }

  zParams.fields = zFields;
  let zCount = await getResultCount({ ...zParams, ...extraParams });
  let zQuery = { ...zParams };
  yParams.fields = yFields;
  let yCount = await getResultCount({ ...yParams, ...extraParams });
  let yQuery = { ...yParams };

  if (zFields.length > 0) {
    zQuery.fields = zFields.join(",");
  }
  if (yFields.length > 0) {
    yQuery.fields = yFields.join(",");
  }
  yParams.query = combineQueries(yParams.query, x);
  yParams.excludeDirect = apiParams.excludeDirect || [];
  yParams.excludeDescendant = apiParams.excludeDescendant || [];
  yParams.excludeAncestral = apiParams.excludeAncestral || [];
  yParams.excludeMissing = apiParams.excludeMissing || [];
  let xCount = await getResultCount({ ...yParams, ...extraParams });
  let xQuery = yParams;
  if (yFields.length > 0) {
    xQuery.fields = yFields.join(",");
  }
  if (
    xCount.status &&
    xCount.status.success &&
    yCount.status &&
    yCount.status.success
  ) {
    return {
      status: { success: true },
      report: {
        arc: xCount.count > 0 ? xCount.count / yCount.count : 0,
        ...(zCount && {
          arc2: yCount.count > 0 ? yCount.count / zCount.count : 0,
        }),
        x: xCount.count,
        y: yCount.count,
        xTerm: x,
        yTerm: y,
        ...(rank && { rank }),
        xQuery,
        yQuery,
        ...(z != y && { z: zCount.count, zTerm: z, zQuery }),
        queryString,
      },
    };
  }
};

const reduceRepetition = ({ x = "", y = "", z = "" }) => {
  let partsX = x.split(/\sAND\s/i);
  let partsY = y.split(/\sAND\s/i);
  let partsZ = z.split(/\sAND\s/i);
  let filteredX = [];
  let filteredY = [];
  for (let partX of partsX) {
    let hasMatch = false;
    for (let partY of partsY) {
      if (partX == partY) {
        hasMatch = true;
        break;
      }
    }
    if (!hasMatch) {
      filteredX.push(partX);
    }
  }
  for (let partY of partsY) {
    let hasMatch = false;
    for (let partZ of partsZ) {
      if (partY == partZ) {
        hasMatch = true;
        break;
      }
    }
    if (!hasMatch) {
      filteredY.push(partY);
    }
  }
  return { minX: filteredX.join(" AND "), minY: filteredY.join(" AND ") };
};

export const arcPerRank = async ({
  x,
  y,
  z,
  result,
  taxonomy,
  rank,
  queryString,
  req,
  ...apiParams
}) => {
  // Return arc at a list of ranks
  let ranks = rank ? setRanks(rank) : [undefined];
  let perRank = [];
  let status;
  for (rank of ranks) {
    let res = await arc({
      x,
      y,
      z,
      result,
      rank,
      taxonomy,
      queryString,
      apiParams,
    });
    if (!res || !res.status) {
      status = { success: false, error: "unable to load report" };
    } else if (res.status.success == false) {
      if (!status) {
        status = res.status;
      }
      perRank.push(res);
    } else {
      perRank.push(res.report);
    }
  }
  if (!status) {
    status = { success: true };
  }
  let report;
  let taxa;
  if (perRank.length == 1) {
    report = perRank[0];
    taxa = ranks[0] ? plurals(ranks[0]) : "taxa";
  } else {
    report = perRank;
    taxa = "taxa";
  }
  let caption = taxa;
  let { minX, minY } = reduceRepetition({ x, y, z });
  if (x) {
    caption += ` with ${z ? minY : minX} out of all ${taxa}`;
  }
  if (y) {
    caption += ` with ${z || minY}`;
  }
  if (z) {
    caption += ` highlighting those with ${minX}`;
  }
  return {
    status,
    report: {
      arc: report,
      queryString,
      caption,
    },
  };
};

export const xPerRank = async ({
  x,
  result = "taxon",
  taxonomy,
  rank,
  includeEstimates,
  queryString,
}) => {
  // Return counts at a list of ranks
  let ranks = setRanks(rank);
  let perRank = [];
  // let includeEstimates = x ? false : true;
  for (rank of ranks) {
    let { params, fields } = await queryParams({
      term: x,
      result,
      rank,
      taxonomy,
      includeEstimates,
    });
    let xCount = await getResultCount({ ...params });
    let xQuery = params;
    if (fields.length > 0) {
      xQuery.fields = fields.join(",");
    }
    perRank.push({
      x: xCount.count,
      xTerm: x,
      rank: rank && plurals(rank),
      xQuery,
      ...(fields.length > 0 && { fields: fields.join(",") }),
    });
  }
  let caption = `Count${ranks.length > 1 ? "s" : ""} of taxa`;
  if (x) {
    caption += ` with ${x}`;
  }

  return {
    status: { success: true },
    report: {
      xPerRank: perRank,
      queryString,
      caption,
    },
  };
};

export const getRawSources = async ({ params, query }) => {
  let index = indexName({ ...params });
  query = await aggregateRawValueSources({ query });
  const { body } = await client
    .search(
      {
        index,
        body: query,
        rest_total_hits_as_int: true,
      },
      { meta: true }
    )
    .catch((err) => {
      return err.meta;
    });
  let fields = [];
  let status = checkResponse({ body });
  if (status.hits) {
    fields = body.aggregations.attributes.direct.fields;
  }
  return { status, fields };
};

export const getSources = async (params, query, queryFields) => {
  const { typesMap } = await attrTypes({
    result: params.result,
    indexType: "attributes",
    taxonomy: params.taxonomy,
  });
  const binned = await getRawSources({
    params,
    ...(query && { query: query.query || query.x }),
  });
  let counts = {};
  let fields = {};
  let urls = {};
  let dates = {};
  if (binned.status.success) {
    binned.fields.buckets.forEach(({ key: field, summary }) => {
      if (!queryFields || queryFields.includes(field)) {
        summary.terms.buckets.forEach(
          ({
            key: source,
            doc_count: count,
            minDate,
            maxDate,
            url: urlAgg,
          }) => {
            minDate = (minDate || {}).value_as_string;
            maxDate = (maxDate || {}).value_as_string;
            let dateRange;
            let url;
            if (minDate) {
              dateRange = [minDate, maxDate];
            }
            let urlBuckets = urlAgg.buckets;
            if (urlBuckets && urlBuckets.length > 0) {
              url = urlBuckets[0].key;
            }
            if (!counts[source]) {
              counts[source] = 0;
            }
            if (!fields[source]) {
              fields[source] = [];
            }
            counts[source] += count;
            fields[source].push(field);
            if (dateRange) {
              if (dates[source]) {
                dates[source] = [
                  dateRange[0] < dates[source][0]
                    ? dateRange[0]
                    : dates[source][0],
                  dateRange[1] > dates[source][1]
                    ? dateRange[1]
                    : dates[source][1],
                ];
              } else {
                dates[source] = dateRange;
              }
            }
            if (url) {
              urls[source] = url;
            }
          }
        );
      }
    });
  }
  let sources = {};
  Object.values(typesMap).forEach((meta) => {
    let source = meta.source || [];
    let source_url = meta.source_url || [];
    let source_url_stub = meta.source_url_stub || [];
    let source_date = meta.source_date || [];
    if (!Array.isArray(source)) {
      source = [source];
    }
    if (!Array.isArray(source_url)) {
      source_url = [source_url];
    }
    if (!Array.isArray(source_url_stub)) {
      source_url_stub = [source_url_stub];
    }
    if (!Array.isArray(source_date)) {
      source_date = [source_date];
    }
    source.forEach((src, i) => {
      if (
        src &&
        typeof src === "string" &&
        counts[src] &&
        !sources.hasOwnProperty(src)
      ) {
        let date = source_date[i];
        sources[src] = {
          url: source_url[i] || source_url_stub[i],
          date,
          attributes: [],
        };
        if (counts[src]) {
          sources[src].count = counts[src];
          sources[src].attributes.push(...fields[src]);
        }
      }
    });
  });

  Object.keys(counts).forEach((src) => {
    // let lcSrc = src.toLowerCase();
    if (!sources.hasOwnProperty(src)) {
      sources[src] = {};
    }
    sources[src].count = counts[src];
    sources[src].attributes = fields[src];
    if (dates[src]) {
      sources[src].date = dates[src];
    }
    if (urls[src]) {
      sources[src].url = urls[src];
    }
  });
  return { report: { sources: sources } };
};

export const getNewickString = ({ treeNodes, rootNode }) => {
  if (!treeNodes || !rootNode) {
    return ";";
  }
  let visited = {};
  const writeNewickString = ({ node }) => {
    visited[node.taxon_id] = true;
    if (
      node.hasOwnProperty("children") &&
      Object.keys(node.children).length > 0
    ) {
      let children = [];
      for (let key of Object.keys(node.children)) {
        if (!visited[treeNodes[key].taxon_id]) {
          children.push(writeNewickString({ node: treeNodes[key] }));
        }
      }
      return children.length > 1
        ? `(${children.join(",")})${node.scientific_name}`
        : children[0];
    }
    return node.scientific_name;
  };
  let newick = writeNewickString({ node: treeNodes[rootNode] });
  return `${newick};\n`;
};

export const getPhyloXml = ({
  treeNodes,
  rootNode,
  taxonomy,
  compact = true,
  meta,
  fields,
}) => {
  if (!treeNodes || !rootNode) {
    return undefined;
  }
  let visited = {};
  let data;
  if (fields) {
    data = {
      tidy: [
        [
          "taxon_id",
          "scientific_name",
          "taxon_rank",
          "field",
          "value",
          "min",
          "max",
          "source",
        ],
      ],
      flat: [["taxon_id", "scientific_name", "taxon_rank", ...fields]],
    };
  }

  const writeTaxonomy = ({
    taxon_id,
    scientific_name,
    taxon_rank,
    taxonomy,
  }) => {
    return `<taxonomy><id provider="${taxonomy}">${taxon_id}</id><scientific_name>${scientific_name}</scientific_name><rank>${taxon_rank}</rank></taxonomy>`;
  };

  const writeName = ({ scientific_name }) => {
    return `<name>${scientific_name}</name>`;
  };

  const writeAnnotation = ({ value, source, field, meta }) => {
    if (!source) {
      return "";
    }
    let unit = meta.unit ? `unit="${meta.unit}"` : "";
    let datatype = `datatype="xsd:integer"`;
    let property = `<property ${datatype} ref="GoaT:${field}" applies_to="clade" ${unit}>${value}</property>`;
    return `<annotation evidence="${source}">${property}</annotation>`;
  };

  const addData = ({ node, data }) => {
    if (node.fields && Object.keys(node.fields).length > 0) {
      let flat = [node.taxon_id, node.scientific_name, node.taxon_rank];
      for (let field of fields) {
        let obj = node.fields[field];
        if (obj) {
          data.tidy.push([
            node.taxon_id,
            node.scientific_name,
            node.taxon_rank,
            field,
            obj.value,
            obj.min,
            obj.max,
            obj.source,
          ]);
          flat.push(obj.value);
        } else {
          flat.push(undefined);
        }
      }
      data.flat.push(flat);
    }
  };

  const writeClade = ({ node }) => {
    visited[node.taxon_id] = true;
    let children = [];
    if (
      node.hasOwnProperty("children") &&
      Object.keys(node.children).length > 0
    ) {
      for (let key of Object.keys(node.children)) {
        if (!visited[treeNodes[key].taxon_id]) {
          children.push(writeClade({ node: treeNodes[key] }));
        }
      }
    }
    if (compact && children.length == 1) {
      return children[0];
    }
    if (fields) {
      addData({ node, data });
    }
    return `<clade><id>${node.taxon_id}</id>${writeName({
      ...node,
    })}${writeTaxonomy({
      ...node,
      taxonomy,
    })}${
      meta && fields
        ? writeAnnotation({
            ...node,
            field: fields[0],
            meta,
          })
        : ""
    }${children.join("\n")}</clade>`;
  };
  let tree = writeClade({ node: treeNodes[rootNode] });
  let phyloXml = `<phyloxml xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.phyloxml.org http://www.phyloxml.org/1.10/phyloxml.xsd" xmlns="http://www.phyloxml.org">
<phylogeny rooted="true">
<name>test</name>
<description>example tree</description>
${tree}
</phylogeny>
</phyloxml>\n`;
  return { phyloXml, data };
};

export const getTypes = async (params) => {
  const { typesMap } = await attrTypes({
    result: params.result,
    indexType: "attributes",
    taxonomy: params.taxonomy,
  });
  let byGroup = {};
  Object.entries(typesMap).forEach(([key, value]) => {
    let group = typesMap[key].display_group;
    if (!byGroup[group]) {
      byGroup[group] = [];
    }
    byGroup[group].push({ key, ...value });
  });
  Object.values(byGroup).forEach((values) => {
    values = values.sort((a, b) => a.name.localeCompare(b.name));
  });
  return { report: { types: byGroup } };

  // search ranks
  let index = indexName({ ...params });
  let query = await aggregateRanks({});
  let { body } = await client
    .search(
      {
        index,
        body: query,
        rest_total_hits_as_int: true,
      },
      { meta: true }
    )
    .catch((err) => {
      return err.meta;
    });
  let status = checkResponse({ body });
  if (status.hits) {
    try {
      byGroup.ranks = Object.values(body.aggregations.lineage.ranks.buckets)
        .map(({ key }) => key)
        .sort((a, b) => a.localeCompare(b));
    } catch (err) {
      // pass
    }
  }
  // search names
  query = await aggregateNameClasses({});
  ({ body } = await client
    .search(
      {
        index,
        body: query,
        rest_total_hits_as_int: true,
      },
      { meta: true }
    )
    .catch((err) => {
      return err.meta;
    }));
  status = checkResponse({ body });
  if (status.hits) {
    try {
      byGroup.names = Object.values(body.aggregations.taxon_names.class.buckets)
        .map(({ key }) => key)
        .sort((a, b) => a.localeCompare(b));
    } catch (err) {
      // pass
    }
  }
  return byGroup;
};

const tableToCSV = ({
  table,
  xLabel,
  yLabel,
  separator = ",",
  includeZeros,
}) => {
  let rows = [];
  if (table.histograms) {
    if (table.cats) {
      if (table.histograms.yBuckets) {
        rows.push([table.cat, xLabel, yLabel, "count"]);
        for (let catObj of table.cats) {
          let values = table.histograms.yValuesByCat[catObj.key];
          table.histograms.buckets.forEach((bucket, i) => {
            if (bucket) {
              table.histograms.yBuckets.forEach((yBucket, j) => {
                if (yBucket && (values[i][j] || includeZeros)) {
                  rows.push([catObj.label, bucket, yBucket, values[i][j] || 0]);
                }
              });
            }
          });
        }
      } else {
        rows.push([table.cat, xLabel, "count"]);
        for (let catObj of table.cats) {
          let values = table.histograms.byCat[catObj.key];
          table.histograms.buckets.forEach((bucket, i) => {
            if (bucket) {
              rows.push([catObj.label, bucket, values[i]]);
            }
          });
        }
      }
    } else {
      rows.push([xLabel, "count"]);
      table.histograms.buckets.forEach((bucket, i) => {
        if (bucket) {
          rows.push([bucket, table.histograms.allValues[i]]);
        }
      });
    }
  } else if (table.scatter) {
    if (table.cats) {
    } else {
      rows.push([table.field, "count"]);
      table.histograms.buckets.forEach((bucket, i) => {
        if (bucket) {
          rows.push([bucket, table.histograms.allValues[i]]);
        }
      });
    }
  }
  let csv = rows
    .map((arr) => {
      return arr.join(separator);
    })
    .join("\n");
  return `${csv}\n`;
};

export const getSearchSources = async (req, res) => {
  let response = {};
  let reqQuery = req.req.query;
  // TODO: handle excude direct ;
  reqQuery.query = reqQuery.x
    .replaceAll(/(tax_name|tax_eq)/g, "tax_tree")
    .split(/\s+AND\s+/i)
    .filter((t) => !t.startsWith("tax_rank"))
    .join(" AND ");
  let excludeDirect;
  ({ excludeDirect, ...req } = req);
  let exclusions = setExclusions(req);
  response = await getResults({ ...reqQuery, exclusions, req });
  if (!response.status.success) {
    return res.status(200).send({ status: response.status });
  }
  if (response.status.hits == 0) {
    let query = await replaceSearchIds(reqQuery);
    if (query != reqQuery.query) {
      response = await getResults({ ...reqQuery, query, exclusions, size: 0 });
      // response = await getResults({
      //   ...req.query,
      //   query,
      //   exclusions,
      //   sortBy,
      //   req,
      // });
      // response.queryString = query;
    }
  }
  return await getSources(reqQuery, response.query, response.fields);
};

function formatReport(res, report, req) {
  return res.format({
    json: () => {
      // let response = formatJson(
      //   { status: { success: true }, report },
      //   req.query.indent
      // );
      // res.status(200).send(response);
      res.type("json");
      res.status(200);
      new JsonStreamStringify({ status: { success: true }, report }).pipe(res);
    },
    "text/html": () => {
      // let response = formatJson(
      //   { status: { success: true }, report },
      //   req.query.indent
      // );
      // res.status(200).send(response);

      res.type("json");
      res.status(200);
      new JsonStreamStringify({ status: { success: true }, report }).pipe(res);
    },
    ...(report.name == "table" && {
      csv: () => {
        let response = tableToCSV({
          ...report.report,
        });
        res.status(200).send(response);
      },
      tsv: () => {
        let response = tableToCSV({
          ...report.report,
          separator: "\t",
        });
        res.status(200).send(response);
      },
    }),
    ...(report.name == "tree" && {
      "text/x-nh": () => {
        let { lca, treeNodes } = report.report.tree.tree;
        let rootNode;
        if (lca) {
          rootNode = lca.taxon_id;
        }
        let response = getNewickString({ treeNodes, rootNode });
        res.status(200).send(response);
      },
      "application/xml": () => {
        let { lca, treeNodes } = report.report.tree.tree;
        let rootNode;
        if (lca) {
          rootNode = lca.taxon_id;
        }
        let { phyloXml } = getPhyloXml({ treeNodes, rootNode });
        res.status(200).send(phyloXml);
      },
      "application/zip": () => {
        let { lca, treeNodes } = report.report.tree.tree;
        let rootNode;
        if (lca) {
          rootNode = lca.taxon_id;
        }
        let fields = report.report.tree.xQuery.fields.split(",");
        let newick = getNewickString({ treeNodes, rootNode });
        let { phyloXml, data } = getPhyloXml({
          treeNodes,
          rootNode,
          fields,
        });

        res.attachment("tree.zip").type("zip");
        const zip = Archiver("zip");
        zip.pipe(res);

        if (data) {
          let flat = "";
          for (let arr of data.flat) {
            flat += arr.join("\t") + "\n";
          }
          zip.append(flat, { name: "tree.data.tsv" });
          let tidy = "";
          for (let arr of data.tidy) {
            tidy += arr.join("\t") + "\n";
          }
          zip.append(tidy, { name: "tree.tidyData.tsv" });
        }
        zip
          .append(newick, { name: "tree.nwk" })
          .append(phyloXml, { name: "tree.xml" })
          .finalize();
      },
    }),
  });
}

export const getReport = async (req, res) => {
  let report;
  try {
    if (await pingCache()) {
      report = await cacheFetch(req);
    }
  } catch (message) {
    logError({ req, message });
  }
  if (!report) {
    report = {};
    let queryString = qs.stringify(req.query);
    let reportFunc;
    let reportParams = { ...req.query, queryString, req };
    switch (req.query.report) {
      case "arc": {
        reportFunc = arcPerRank;
        break;
      }
      case "files": {
        reportFunc = getFiles;
        break;
      }
      case "oxford": {
        reportFunc = getOxford;
        break;
      }
      case "ribbon": {
        reportFunc = getOxford;
        break;
      }
      case "histogram": {
        reportFunc = histPerRank;
        break;
      }
      case "map": {
        reportFunc = getMap;
        break;
      }
      case "scatter": {
        reportFunc = scatterPerRank;
        break;
      }
      case "sources": {
        if (!req.query.x) {
          reportFunc = getSources;
        } else {
          reportFunc = getSearchSources;
        }
        break;
      }
      case "table": {
        reportFunc = tablePerRank;
        break;
      }
      case "tree": {
        reportFunc = getTree;
        break;
      }
      case "types": {
        reportFunc = getTypes;
        break;
      }
      case "xPerRank": {
        reportFunc = xPerRank;
        break;
      }
    }
    if (reportFunc) {
      try {
        report = await reportFunc(reportParams);
        cacheStore(req, report);
      } catch (message) {
        logError({ message, req });
        const timestamp = new Date();
        const error = `unexpected error at ${timestamp.toLocaleString()}`;
        let status = {
          success: false,
          error,
          timestamp,
          message,
        };
        report = {
          status,
          report: {
            tree: {
              status,
            },
          },
          queryString,
        };
      }
    }
  }
  if (report && report != {}) {
    try {
      report.name = req.query.report;
      // let typesMap, lookupTypes;
      // if (report.name == "tree") {
      //   ({ typesMap, lookupTypes } = await attrTypes({ ...req.query }));
      // }
      return formatReport(res, report, req);
    } catch (message) {
      logError({ req, message });
    }
  }
  return res.status(400).send({ status: "error" });
};
