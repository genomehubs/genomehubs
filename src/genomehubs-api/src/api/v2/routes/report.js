import { cacheFetch, cacheStore } from "../functions/cache";

import { aggregateRawValueSources } from "../queries/aggregateRawValueSources";
import { attrTypes } from "../functions/attrTypes";
import { checkResponse } from "../functions/checkResponse";
import { client } from "../functions/connection";
import { combineQueries } from "../functions/combineQueries";
import { formatJson } from "../functions/formatJson";
import { getResultCount } from "../functions/getResultCount";
import { histogram } from "../reports/histogram";
import { indexName } from "../functions/indexName";
import qs from "qs";
import { queryParams } from "../reports/queryParams";
import { setRanks } from "../functions/setRanks";
import { tree } from "../reports/tree";

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
  let report = res.report;
  let xQuery = res.xQuery;
  let yQuery = res.yQuery;
  let xLabel = res.xLabel;
  let caption;
  if (report) {
    caption = `Tree of ${x}${report.y ? ` highlighting ${y}` : ""}`;
    if (cat) {
      caption += ` by ${cat}`;
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
      report: "scatter",
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
    caption += ` by ${cat}`;
  }
  if (apiParams.includeEstimates) {
    caption += ` including ancestrally derived estimates`;
  }
  return {
    status,
    report: {
      scatter: report,
      xQuery,
      yQuery,
      xLabel,
      yLabel,
      queryString,
      caption,
    },
  };
};

export const histPerRank = async ({
  x,
  xOpts,
  cat,
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
      rank,
      result: apiParams.result,
      taxonomy,
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
    caption += ` by ${cat}`;
  }
  if (apiParams.includeEstimates) {
    caption += ` including ancestrally derived estimates`;
  }
  return {
    status,
    report: {
      histogram: report,
      valueType: report.valueType,
      xQuery,
      xLabel,
      yLabel: `Count of ${ranks[0]}`,
      queryString,
      caption,
    },
  };
};

export const xInY = async ({
  x,
  y,
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
  if (!rank) {
    return {
      status: {
        success: false,
        error: `no rank specified`,
      },
    };
  }
  let { params, fields } = queryParams({ term: y, result, taxonomy, rank });
  params.includeEstimates = apiParams.hasOwnProperty("includeEstimates")
    ? apiParams.includeEstimates
    : false;
  if (rank) {
    x.split(/\s+(?:and|AND)\s+/).forEach((term) => {
      if (!term.match("tax_")) {
        let field = term.replace(/[^\w_\(\)].+$/, "");
        if (field.match(/\(/)) {
          field = field.split(/[\(\)]/)[1];
        }
        fields.push(field);
      }
    });
    if (fields.length == 0) {
      fields = ["all"];
    }
  }
  params.fields = fields;
  let yCount = await getResultCount({ ...params });
  let yQuery = { ...params };
  if (fields.length > 0) {
    yQuery.fields = fields.join(",");
  }
  params.query = combineQueries(params.query, x);
  params.excludeDirect = apiParams.excludeDirect || [];
  params.excludeDescendant = apiParams.excludeDescendant || [];
  params.excludeAncestral = apiParams.excludeAncestral || [];
  params.excludeMissing = apiParams.excludeMissing || [];
  let xCount = await getResultCount({ ...params });
  let xQuery = params;
  if (fields.length > 0) {
    xQuery.fields = fields.join(",");
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
        xiny: xCount.count > 0 ? xCount.count / yCount.count : 0,
        x: xCount.count,
        y: yCount.count,
        xTerm: x,
        yTerm: y,
        ...(rank && { rank }),
        xQuery,
        yQuery,
        queryString,
      },
    };
  }
};

export const xInYPerRank = async ({
  x,
  y,
  result,
  taxonomy,
  rank,
  queryString,
  req,
  ...apiParams
}) => {
  // Return xInY at a list of ranks
  let ranks = rank ? setRanks(rank) : [undefined];
  let perRank = [];
  let status;
  for (rank of ranks) {
    let res = await xInY({
      x,
      y,
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
  if (x) {
    caption += ` with ${x} out of all ${taxa}`;
  }
  if (y) {
    caption += ` with ${y}`;
  }
  return {
    status,
    report: {
      xInY: report,
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
  queryString,
}) => {
  // Return counts at a list of ranks
  let ranks = setRanks(rank);
  let perRank = [];
  let includeEstimates = x ? false : true;
  for (rank of ranks) {
    let { params, fields } = queryParams({
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

export const getRawSources = async (params) => {
  let index = indexName({ ...params });
  const query = await aggregateRawValueSources({});
  const { body } = await client
    .search({
      index,
      body: query,
      rest_total_hits_as_int: true,
    })
    .catch((err) => {
      return err.meta;
    });
  let fields = [];
  let status = checkResponse({ body });
  if (status.hits) {
    fields = body.aggregations.attributes.fields;
  }
  return { status, fields };
};

export const getSources = async (params) => {
  const types = await attrTypes({
    result: params.result,
    indexType: "attributes",
    taxonomy: params.taxonomy,
  });
  const binned = await getRawSources(params);
  let counts = {};
  let fields = {};
  if (binned.status.success) {
    binned.fields.buckets.forEach(({ key: field, summary }) => {
      summary.terms.buckets.forEach(({ key: source, doc_count: count }) => {
        if (!counts[source]) {
          counts[source] = 0;
        }
        if (!fields[source]) {
          fields[source] = [];
        }
        counts[source] += count;
        fields[source].push(field);
      });
    });
  }
  let sources = {};
  Object.values(types).forEach((meta) => {
    let source = meta.source || [];
    let source_url = meta.source_url || [];
    let source_url_stub = meta.source_url_stub || [];
    if (!Array.isArray(source)) {
      source = [source];
    }
    if (!Array.isArray(source_url)) {
      source_url = [source_url];
    }
    if (!Array.isArray(source_url_stub)) {
      source_url_stub = [source_url_stub];
    }
    source.forEach((src, i) => {
      if (src && typeof src === "string") {
        let lcSrc = src.toLowerCase();
        if (counts[lcSrc] && !sources.hasOwnProperty(lcSrc)) {
          sources[lcSrc] = {
            url: source_url[i] || source_url_stub[i],
            attributes: [],
          };
          if (counts[lcSrc]) {
            sources[lcSrc].count = counts[lcSrc];
            sources[lcSrc].attributes.push(...fields[lcSrc]);
          }
        }
      }
    });
  });
  Object.keys(counts).forEach((src) => {
    if (!sources.hasOwnProperty(src)) {
      sources[src] = {};
    }
    sources[src].count = counts[src];
    sources[src].attributes = fields[src];
  });
  return { report: { sources: sources } };
};

export const getNewickString = ({ treeNodes, rootNode }) => {
  if (!treeNodes || !rootNode) return ";";
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
  if (!treeNodes || !rootNode) return undefined;
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
  const types = await attrTypes({
    result: params.result,
    indexType: "attributes",
    taxonomy: params.taxonomy,
  });
  let byGroup = {};
  Object.keys(types).forEach((key) => {
    let group = types[key].display_group;
    if (!byGroup[group]) {
      byGroup[group] = [];
    }
    byGroup[group].push(key);
  });
  Object.values(byGroup).forEach((values) => {
    values = values.sort((a, b) => a.localeCompare(b));
  });
  return byGroup;
};

export const getReport = async (req, res) => {
  req.url = req.url.replace(/&queryId=[\w\d-_]+/, "");
  let report = await cacheFetch(req);
  if (!report) {
    report = {};
    let queryString = qs.stringify(req.query);
    let reportFunc;
    let reportParams = { ...req.query, queryString, req };
    switch (req.query.report) {
      case "histogram": {
        reportFunc = histPerRank;
        // report = await histPerRank({ ...req.query, queryString, req });
        break;
      }
      case "scatter": {
        reportFunc = scatterPerRank;
        // report = await scatterPerRank({ ...req.query, queryString, req });
        break;
      }
      case "sources": {
        reportFunc = getSources;
        // report = await getSources({ ...req.query, queryString });
        break;
      }
      case "tree": {
        reportFunc = getTree;
        // report = await getTree({ ...req.query, queryString, req });
        break;
      }
      case "types": {
        reportFunc = getTypes;
        // report = await getTypes({ ...req.query, queryString });
        break;
      }
      case "xInY": {
        reportFunc = xInYPerRank;
        // report = await xInYPerRank({ ...req.query, queryString });
        break;
      }
      case "xPerRank": {
        reportFunc = xPerRank;
        // report = await xPerRank({ ...req.query, queryString });
        break;
      }
    }
    if (reportFunc) {
      try {
        report = await reportFunc(reportParams);
        cacheStore(req, report);
      } catch (message) {
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
    report.name = req.query.report;
    let typesMap;
    if (report.name == "tree") {
      typesMap = await attrTypes({ ...req.query });
    }

    return res.format({
      json: () => {
        res
          .status(200)
          .send(
            formatJson({ status: { success: true }, report }, req.query.indent)
          );
      },
      "text/html": () => {
        res
          .status(200)
          .send(
            formatJson({ status: { success: true }, report }, req.query.indent)
          );
      },
      ...(report.name == "tree" && {
        "text/x-nh": () => {
          let { lca, treeNodes } = report.report.tree.tree;
          let rootNode;
          if (lca) {
            rootNode = lca.taxon_id;
          }
          res.status(200).send(getNewickString({ treeNodes, rootNode }));
        },
        "application/xml": () => {
          let { lca, treeNodes } = report.report.tree.tree;
          let rootNode;
          if (lca) {
            rootNode = lca.taxon_id;
          }

          // let fields = report.report.tree.xQuery.fields;
          // let meta;
          // let field;
          // if (fields) {
          //   if (Array.isArray(fields)) {
          //     field = fields[0];
          //     meta = typesMap[fields[0]];
          //   } else {
          //     field = fields.replace(/,.+/, "");
          //     meta = typesMap[field];
          //   }
          // }
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
          // let meta;
          // let field;
          // if (fields) {
          //   if (Array.isArray(fields)) {
          //     field = fields[0];
          //     meta = typesMap[fields[0]];
          //   } else {
          //     field = fields.replace(/,.+/, "");
          //     meta = typesMap[field];
          //   }
          // }
          let newick = getNewickString({ treeNodes, rootNode });
          let { phyloXml, data } = getPhyloXml({
            treeNodes,
            rootNode,
            fields,
          });
          let dataFiles = [];
          if (data) {
            let flat = "";
            for (let arr of data.flat) {
              flat += arr.join("\t") + "\n";
            }
            let tidy = "";
            for (let arr of data.tidy) {
              tidy += arr.join("\t") + "\n";
            }
            dataFiles = [
              {
                content: flat,
                name: "tree.data.tsv",
                mode: "0644",
                comment: "TSV format data associated with tree nodes",
                date: new Date(),
                type: "file",
              },
              {
                content: tidy,
                name: "tree.tidyData.tsv",
                mode: "0644",
                comment: "TidyData format data associated with tree nodes",
                date: new Date(),
                type: "file",
              },
            ];
          }
          res.status(200).zip({
            files: [
              {
                content: newick,
                name: "tree.nwk",
                mode: "0644",
                comment: "Newick format tree file",
                date: new Date(),
                type: "file",
              },
              {
                content: phyloXml,
                name: "tree.xml",
                mode: "0644",
                comment: "PhyloXML format tree file",
                date: new Date(),
                type: "file",
              },
            ].concat(dataFiles),
            filename: "tree.zip",
          });
        },
      }),
    });
  }
  return res.status(404).send({ status: "error" });
};
