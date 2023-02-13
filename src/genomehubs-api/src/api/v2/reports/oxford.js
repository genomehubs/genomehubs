import { getProgress, setProgress } from "../functions/progress";
import { linearRegression, medianSorted } from "simple-statistics";

import { aInB } from "../functions/aInB";
import { attrTypes } from "../functions/attrTypes";
import { combineQueries } from "../functions/combineQueries";
import { config } from "../functions/config";
import { getBounds } from "./getBounds";
import { getResultCount } from "../functions/getResultCount";
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

const parseAssemblies = (query) => {
  let parts = query.split(/\sAND\s/i);
  for (let part of parts) {
    let [key, value] = part.split(/\s*=\s*/);
    if (key != "assembly_id") {
      continue;
    }
    return value.split(",");
  }
};

const parseCollate = (query) => {
  let parts = query.split(/\sAND\s/i);
  for (let part of parts) {
    let [key, value] = part.split(/\s*[\(\)]\s*/);
    if (key != "collate") {
      continue;
    }
    let [attrA, attrB] = value.split(",");
    return attrB;
  }
};

const getSequenceLengths = async ({ assemblies, xQuery, taxonomy, req }) => {
  let seqQuery = {
    ...xQuery,
    query: `assembly_id=${assemblies.join(",")} AND feature_type=topLevel`,
    fields: ["sequence_id", "length"],
    exclusions: {},
  };
  let countRes = await getResultCount(seqQuery);
  if (!countRes.status.success) {
    return { status: countRes.status };
  }
  let count = countRes.count;

  let seqRes = await getResults({
    ...seqQuery,
    size: count,
    taxonomy,
    req,
  });
  if (!seqRes.status.success) {
    return { status: seqRes.status };
  }
  let lengths = {};
  for (let result of seqRes.results) {
    let { assembly_id, fields } = result.result;
    let { sequence_id, length } = fields;
    sequence_id = sequence_id.value;
    length = length.value;
    if (!lengths[assembly_id]) {
      lengths[assembly_id] = {};
    }
    lengths[assembly_id][sequence_id] = length;
  }
  return lengths;
};

const getOxford = async ({
  params,
  x,
  field,
  y,
  yParams,
  fields,
  groupBy,
  asms,
  yFields,
  cat,
  bounds,
  yBounds,
  result,
  queryId,
  catRank,
  taxonomy,
  req,
}) => {
  let { lookupTypes } = await attrTypes({ result, taxonomy });
  // let field = yFields[0] || fields[0];
  let exclusions;
  exclusions = setExclusions(params);

  // get list of assembly_ids
  // search all feature_type = top_level and create lookup table

  let xQuery = {
    ...params,
    // query: x,
    fields,
    exclusions,
  };
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
  let count = countRes.count;

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
  let byAssembly = {};
  let groupedData = {};
  let activeSeqs = {};
  for (let result of xRes.results) {
    let { taxon_id, assembly_id, feature_id, fields } = result.result;
    let group = fields[groupBy].value;
    if (!groupedData[group]) {
      groupedData[group] = {};
    }
    if (!byAssembly[assembly_id]) {
      byAssembly[assembly_id] = {};
      activeSeqs[assembly_id] = {};
    }
    if (!groupedData[group][assembly_id]) {
      groupedData[group][assembly_id] = [];
    }
    let { sequence_id, start, end, strand } = fields;
    sequence_id = sequence_id.value;
    start = start.value;
    end = end.value;
    strand = strand.value;
    if (!byAssembly[assembly_id][sequence_id]) {
      byAssembly[assembly_id][sequence_id] = [];
      activeSeqs[assembly_id][sequence_id] = true;
    }
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
      cat = "all features";
    }
    byAssembly[assembly_id][sequence_id].push({
      group,
      start,
      end,
      strand,
      taxon_id,
      assembly_id,
      feature_id,
      cat,
    });
    if (assembly_id != asms[0]) {
      groupedData[group][assembly_id].push({
        sequence_id,
        start,
        end,
        strand,
        cat,
        feature_id,
      });
    }
  }
  let seqLengths = await getSequenceLengths({
    assemblies: Object.keys(byAssembly),
    xQuery,
    taxonomy,
    req,
  });
  let sortedSeqs = {};
  let seqOffsets = {};
  let seqIndices = {};
  let domains = {};
  let buckets = {};
  let labels = {};
  let allValues = {};
  let allYValues = {};
  let byCat = {};
  let yValuesByCat = {};
  for (let [assembly, seqs] of Object.entries(activeSeqs)) {
    for (let seq of Object.keys(seqs)) {
      seqs[seq] = seqLengths[assembly][seq];
    }
    sortedSeqs[assembly] = Object.entries(activeSeqs[assembly]).sort(
      (a, b) => b[1] - a[1]
    );
    seqOffsets[assembly] = {};
    seqIndices[assembly] = {};
    let offset = 0;
    buckets[assembly] = [];
    labels[assembly] = [];
    for (let [seq, len] of sortedSeqs[assembly]) {
      seqOffsets[assembly][seq] = offset;
      seqIndices[assembly][seq] = buckets[assembly].length;
      buckets[assembly].push(offset);
      labels[assembly].push(seq);
      offset += len;
    }
    buckets[assembly].push(offset);
    domains[assembly] = [0, offset];
  }

  let groupScores = {};
  let featArrays = { ref: {}, cmp: {} };
  for (let [sequence_id] of sortedSeqs[asms[0]]) {
    for (let feat of byAssembly[asms[0]][sequence_id]) {
      let { group, start } = feat;
      groupScores[group] = start + seqOffsets[asms[0]][sequence_id];
      if (!featArrays.ref[group]) {
        featArrays.ref[group] = {};
      }
      if (!featArrays.ref[group][sequence_id]) {
        featArrays.ref[group][sequence_id] = [];
      }
      featArrays.ref[group][sequence_id].push(start);
    }
  }
  let seqScores = {};
  let seqOrient = {};

  for (let [sequence_id] of Object.entries(activeSeqs[asms[1]])) {
    let seqScore = 0;
    let seqCount = 0;
    let seqArray = [];
    for (let feat of byAssembly[asms[1]][sequence_id]) {
      let { group, start } = feat;
      if (!groupScores[group]) {
        continue;
      }
      for (let [refSeqId, startArray] of Object.entries(
        featArrays.ref[group]
      )) {
        if (!featArrays.cmp[sequence_id]) {
          featArrays.cmp[sequence_id] = {};
        }
        if (!featArrays.cmp[sequence_id][refSeqId]) {
          featArrays.cmp[sequence_id][refSeqId] = [];
        }
        for (let refStart of featArrays.ref[group][refSeqId]) {
          featArrays.cmp[sequence_id][refSeqId].push([refStart, start]);
        }
      }
      seqScore += groupScores[group];
      seqArray.push(groupScores[group]);
      seqCount++;
    }
    seqScores[sequence_id] = seqScore / seqCount;
    seqScores[sequence_id] = medianSorted(seqArray);
    if (isNaN(seqScores[sequence_id])) {
      seqScores[sequence_id] = 0;
    }
  }

  for (let [sequenceId, obj] of Object.entries(featArrays.cmp)) {
    let maxArray = [];
    for (let arr of Object.values(obj)) {
      if (arr.length > maxArray.length) {
        maxArray = arr;
      }
    }
    let eqn = linearRegression(maxArray);
    seqOrient[sequenceId] = eqn.m >= 0 ? 1 : -1;
  }

  seqOffsets[asms[1]] = {};
  seqIndices[asms[1]] = {};
  let offset = 0;
  buckets[asms[1]] = [];
  labels[asms[1]] = [];
  for (let [seq, score] of Object.entries(seqScores).sort(
    (a, b) => a[1] - b[1]
  )) {
    let offsetCorrection = 0;
    if (seqOrient[seq] < 0) {
      offsetCorrection = seqLengths[asms[1]][seq];
      offset += offsetCorrection;
    }
    seqOffsets[asms[1]][seq] = offset;
    seqIndices[asms[1]][seq] = buckets[asms[1]].length;
    buckets[asms[1]].push(offset - offsetCorrection);
    labels[asms[1]].push(seq);
    if (seqOrient[seq] > 0) {
      offset += seqLengths[asms[1]][seq];
    }
  }
  buckets[asms[1]].push(offset);
  domains[asms[1]] = [0, offset];

  let rawData = {};
  //   {
  //     "scientific_name": "Acanthisitta chloris",
  //     "taxonId": "57068",
  //     "x": 1753226,
  //     "y": 1753226,
  //     "cat": "alternate-pseudohaplotype"
  // },
  let i = 0;
  allValues = [];
  allYValues = [];
  if (bounds.cats) {
    byCat = bounds.cats
      .map((cat) => cat.key)
      .reduce((a, b) => ({ ...a, [b]: buckets[asms[0]].map(() => 0) }), {});
    yValuesByCat = bounds.cats
      .map((cat) => cat.key)
      .reduce(
        (a, b) => ({
          ...a,
          [b]: buckets[asms[0]].map(() => buckets[asms[1]].map(() => 0)),
        }),
        {}
      );
  } else {
    byCat["all features"] = buckets[asms[0]].map(() => 0);
    yValuesByCat["all features"] = buckets[asms[0]].map(() =>
      buckets[asms[1]].map(() => 0)
    );
  }
  for (let [sequence_id, len] of sortedSeqs[asms[0]]) {
    allValues[i] = byAssembly[asms[0]][sequence_id].flat().length;
    allYValues[i] = buckets[asms[1]].map(() => 0);
    for (let feat of byAssembly[asms[0]][sequence_id]) {
      let {
        group,
        start,
        end,
        strand,
        taxon_id,
        assembly_id,
        feature_id,
        cat,
      } = feat;
      // allValues[asms[0]][i]++;
      if (!rawData[cat]) {
        rawData[cat] = [];
      }
      start += seqOffsets[assembly_id][sequence_id];
      end += seqOffsets[assembly_id][sequence_id];
      byCat[cat][i]++;
      for (let [assembly, arr] of Object.entries(groupedData[group])) {
        // if (assembly == assembly_id) {
        //   continue;
        // }
        for (let partner of arr) {
          let index = seqIndices[assembly][partner.sequence_id];
          let pStart, pEnd;
          if (seqOrient[partner.sequence_id] > 0) {
            pStart = partner.start + seqOffsets[assembly][partner.sequence_id];
            pEnd = partner.end + seqOffsets[assembly][partner.sequence_id];
          } else {
            pStart = seqOffsets[assembly][partner.sequence_id] - partner.start;
            pEnd = seqOffsets[assembly][partner.sequence_id] - partner.end;
          }
          allYValues[i][index]++;
          yValuesByCat[cat][i][index]++;
          rawData[cat].push({
            featureId: feature_id,
            yFeatureId: partner.feature_id,
            sequenceId: sequence_id,
            ySequenceId: partner.sequence_id,
            group,
            cat,
            x: strand > 0 ? start : end,
            x2: strand > 0 ? end : start,
            y: partner.strand > 0 ? pStart : pEnd,
            y2: partner.strand > 0 ? pEnd : pStart,
            strand,
            yStrand: partner.strand,
          });
        }
      }
    }
    i++;
  }
  let yArr = allYValues.flat();
  let zDomain = [Math.min(...yArr), Math.max(...yArr)];
  bounds = {
    field: asms[0],
    scale: "linear",
    stats: {
      count: xRes.results.length, // update this
      min: domains[asms[0]][0],
      max: domains[asms[0]][1],
    },
    type: "coordinate",
    labels: labels[asms[0]],
    domain: domains[asms[0]],
    tickCount: buckets[asms[0]].length,
    by: bounds.by,
    cat: bounds.cat || "none",
    cats: bounds.cats || [{ key: "all features", label: "all features" }],
  };
  yBounds = {
    field: asms[1],
    scale: "linear",
    stats: {
      count: xRes.results.length, // update this
      min: domains[asms[1]][0],
      max: domains[asms[1]][1],
    },
    type: "coordinate",
    labels: labels[asms[1]],
    domain: domains[asms[1]],
    tickCount: buckets[asms[1]].length,
    by: bounds.by,
    cat: bounds.cat,
    cats: bounds.cats,
  };
  return {
    buckets: buckets[asms[0]],
    allValues,
    byCat,
    rawData,
    fields,
    cat: bounds.cat,
    cats: bounds.cats,
    valueType: "coordinate",
    yValueType: "coordinate",
    yBuckets: buckets[asms[1]],
    yOrientation: seqOrient,
    allYValues,
    yValuesByCat,
    zDomain,
    bounds,
    yBounds,
  };
};

export const oxford = async ({
  x,
  // y,
  cat,
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
    taxonomy,
  });

  let asms = parseAssemblies(params.query);
  let groupBy = parseCollate(params.query);
  // TODO: Get list of assemblies
  //       Choose primary assembly as one with most hits/best contiguity
  //       Use xOpts/yOpts to fix assembly ordering?
  //       Find position and orientation of each feature on each assembly
  //       Group by contiguous (+syntenic) blocks for Circos
  //       Sort features by primary assembly position/orientation
  //       Add options for secondary assembly sort order

  // 1. Get count per assembly (bin by cat and by sequence)
  // 2. Find all assembly names
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
  xFields = [
    ...new Set([
      groupBy,
      "sequence_id",
      "start",
      "end",
      "strand",
      ...searchFields,
    ]),
  ];
  fields = xFields;

  let status;
  if (!x || !aInB(xFields, Object.keys(typesMap))) {
    status = {
      success: false,
      error: `unknown field in 'x = ${x}'`,
    };
    return { status };
  }

  if (!groupBy || !lookupTypes(groupBy)) {
    status = {
      success: false,
      error: `collate field not recognised.\nTry 'collate(assembly_id,busco_gene)'`,
    };
    return { status };
  }
  // let yTerm = combineQueries(x, y);
  // let {
  //   params: yParams,
  //   fields: yFields,
  //   summaries: ySummaries,
  // } = await queryParams({
  //   term: yTerm,
  //   result,
  //   taxonomy,
  // });
  // if (y && !aInB(yFields, Object.keys(typesMap))) {
  //   status = {
  //     success: false,
  //     error: `unknown field in 'y = ${y}'`,
  //   };
  // }
  params.includeEstimates = apiParams.hasOwnProperty("includeEstimates")
    ? apiParams.includeEstimates
    : false;
  // yParams.includeEstimates = params.includeEstimates;
  params.excludeDirect = apiParams.excludeDirect || [];
  params.excludeDescendant = apiParams.excludeDescendant || [];
  params.excludeAncestral = apiParams.excludeAncestral || [];
  params.excludeMissing = apiParams.excludeMissing || [];

  // yParams.excludeDirect = apiParams.excludeDirect || [];
  // yParams.excludeDescendant = apiParams.excludeDescendant || [];
  // yParams.excludeAncestral = apiParams.excludeAncestral || [];
  // yParams.excludeMissing = apiParams.excludeMissing || [];

  // if (params.includeEstimates) {
  //   delete params.excludeAncestral;
  //   delete yParams.excludeAncestral;
  // }

  // delete params.excludeDescendant;
  // delete yParams.excludeDescendant;

  let xQuery = { ...params };
  // let yQuery = { ...yParams };

  let optionalFields = [...fields];
  if (apiParams.fields) {
    optionalFields = optionalFields.concat(apiParams.fields.split(","));
  }
  optionalFields = [...new Set([...optionalFields])];

  // let mapThreshold = apiParams.mapThreshold || config.mapThreshold;
  // if (mapThreshold < 0) {
  //   mapThreshold = 1000;
  // }
  let bounds;
  let exclusions = setExclusions(params);
  bounds = await getBounds({
    params: { ...params },
    fields: xFields.filter(
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
  // let yBounds;
  // if (y) {
  //   yBounds = await getBounds({
  //     params: { ...params },
  //     fields: yFields.filter(
  //       (field) => lookupTypes(field) && lookupTypes(field).type != "keyword"
  //     ),
  //     summaries,
  //     cat,
  //     result,
  //     exclusions,
  //     taxonomy,
  //     apiParams,
  //     opts: yOpts,
  //   });
  // }
  let oxford = status
    ? {}
    : await getOxford({
        params,
        fields,
        catRank,
        summaries,
        cat,
        groupBy,
        asms,
        bounds,
        // yBounds,
        x,
        // y,
        // yParams,
        // yFields,
        // ySummaries,
        result,
        // mapThreshold,
        queryId: apiParams.queryId,
        req,
        taxonomy,
      });
  if (oxford && oxford.status && oxford.status.success == false) {
    status = { ...oxford.status };
    oxford = {};
  }
  let yBounds;
  ({ bounds, yBounds } = oxford);

  console.log(oxford);

  return {
    status: status || { success: true },
    report: {
      status,
      histograms: oxford,
      bounds,
      groupBy,
      cat: bounds.cat,
      cats: bounds.cats,
      yBounds,
      xQuery: {
        ...xQuery,
        fields: optionalFields.join(","),
      },
      // ...(y && {
      //   yQuery: {
      //     ...yQuery,
      //     fields: optionalFields.join(","),
      //     yFields,
      //   },
      // }),
      // x: tree.lca ? tree.lca.count : 0,
      // ...(y && { y: tree.lca && tree.lca.yCount ? tree.lca.yCount : 0 }),
    },
    xQuery,
    // ...(y && { yQuery }),
    xLabel: asms[0],
    yLabel: asms[1],
    // ...(y && { yLabel: yFields[0] }),
  };
};
