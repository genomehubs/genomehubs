import { linearRegression, median } from "simple-statistics";

import { aInB } from "../functions/aInB.js";
import { attrTypes } from "../functions/attrTypes.js";
import { getBounds } from "./getBounds.js";
import { getResultCount } from "../functions/getResultCount.js";
import { getResults } from "../functions/getResults.js";
import { histogramAgg } from "../queries/histogramAgg.js";
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

const categoryQuery = (query, assembly) =>
  query
    .replace(/assembly_id\s*=\s*\S+/i, `assembly_id=${assembly}`)
    .replace(/\s+AND\s+collate\([^)]*\)/i, "");

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
    query: `assembly_id=${assemblies.join(",")} AND feature_type=toplevel`,
    fields: ["sequence_id", "length"],
    exclusions: {},
  };
  let countRes = await getResultCount(seqQuery);
  if (!countRes.status.success) {
    return { status: countRes.status };
  }
  let { count } = countRes;

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

const scaleFuncs = {
  log2: (value) => Math.pow(2, value),
  log10: (value) => Math.pow(10, value),
  log: (value) => Math.pow(Math.E, value),
  sqrt: (value) => Math.pow(value, 2),
  linear: (value) => value,
};

const formatValue = {
  // TODO: format float to n s.f.
  float: (value) => value,
  integer: (value) => Math.floor(value),
};

const getOxford = async ({
  params,
  fields,
  groupBy,
  asms,
  summaries,
  bounds,
  yBounds,
  result,
  taxonomy,
  reorient,
  req,
  alignment = "reference",
  passThrough = false,
}) => {
  let exclusions;
  exclusions = setExclusions(params);

  // get list of assembly_ids
  // search all feature_type = top_level and create lookup table
  let xQuery = {
    ...params,
    fields,
    exclusions,
  };
  let histogram;
  let restrictCats = false;
  if (bounds.cat) {
    if (bounds.by == "attribute") {
      if (bounds.catType == "keyword" && !bounds.showOther) {
        // Applied after the fetch: a query-level filter would also remove
        // the y-assembly features needed for collate pairs and ribbons
        restrictCats = true;
      } else if (bounds.catType != "keyword") {
        let summary = summaries[0];
        let field = bounds.cat;
        // TODO: set this from option
        histogram = await histogramAgg({
          field,
          summary,
          result,
          bounds: {
            stats: {
              ...bounds.stats,
              min: bounds.domain[0],
              max: bounds.domain[1],
            },
            ...bounds,
            tickCount: bounds.catCount,
          },
          taxonomy,
        });
        xQuery.aggs = {
          aggregations: {
            nested: {
              path: "attributes",
            },
            aggs: {
              [field]: {
                filter: {
                  term: { "attributes.key": field },
                },
                aggs: {
                  histogram,
                },
              },
            },
          },
        };
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

  // TODO: use scroll API to allow > 10000 results
  let xRes = await getResults({
    ...xQuery,
    size: count,
    taxonomy,
    req,
  });

  if (!xRes.status.success) {
    return { status: xRes.status };
  }

  if (restrictCats) {
    let catKeys = new Set(bounds.cats.map(({ key }) => key));
    xRes.results = xRes.results.filter(({ result }) => {
      if (result.assembly_id !== asms[0]) {
        return true;
      }
      let value = result.fields[bounds.cat]?.value;
      let seq = String(Array.isArray(value) ? value[0] : value).toLowerCase();
      return catKeys.has(seq);
    });
  }

  let cats;
  if (bounds.cats && bounds.cats.length > 0) {
    cats = new Set(bounds.cats.map(({ key }) => key));
  } else if (
    bounds.cat &&
    (bounds.catType == "float" || bounds.catType == "integer")
  ) {
    let { buckets } = xRes.aggs.aggregations[bounds.cat].histogram;
    let scaleFunc = bounds.scale ? scaleFuncs[bounds.scale] : scaleFuncs.linear;
    cats = buckets.map(({ key }, i) => [
      scaleFunc(key),
      scaleFunc(buckets[Math.min(i + 1, buckets.length - 1)].key),
    ]);
    bounds.cats = cats
      .filter(([min, max]) => min != max)
      .map(([min, max]) => ({
        key: min,
        label: `${formatValue[bounds.catType](min)}-${formatValue[
          bounds.catType
        ](max)}`,
      }));
  }

  let byAssembly = {};
  for (let result of xRes.results) {
    let { taxon_id, assembly_id, feature_id, fields } = result.result;
    let group = fields[groupBy].value;
    if (!byAssembly[assembly_id]) {
      byAssembly[assembly_id] = {};
    }
    let { sequence_id, start, end, strand } = fields;
    sequence_id = sequence_id.value;
    start = start.value;
    end = end.value;
    strand = strand.value;
    if (!byAssembly[assembly_id][sequence_id]) {
      byAssembly[assembly_id][sequence_id] = [];
    }
    let cat;
    if (bounds.cat) {
      if (bounds.by == "attribute") {
        let catObj = result.result.fields[bounds.cat];
        if (bounds.catType == "keyword") {
          if (catObj) {
            cat = catObj.value.toLowerCase();
          }
          if (Array.isArray(cat)) {
            cat = cat[0].toLowerCase();
          }
        } else {
          for (let limits of cats) {
            if (catObj.value < limits[1]) {
              cat = limits[0];
              break;
            }
          }
        }
      } else if (result.result.ranks) {
        cat = result.result.ranks[bounds.cat];
        if (cat) {
          cat = cat.taxon_id;
        }
      }
      if (
        typeof cat === "undefined" ||
        (!Array.isArray(cats) && !cats.has(cat))
      ) {
        cat = "other";
      }
    }
    if (typeof cat === "undefined") {
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
  }
  let seqLengths = await getSequenceLengths({
    assemblies: Object.keys(byAssembly),
    xQuery: {
      ...xQuery,
      aggs: undefined,
    },
    taxonomy,
    req,
  });
  const seqsOf = (asm) => byAssembly[asm] || {};
  let lengths = {};
  let defaultOrder = {};
  for (let asm of asms) {
    lengths[asm] = {};
    for (let seq of Object.keys(seqsOf(asm))) {
      lengths[asm][seq] = seqLengths[asm][seq];
    }
    defaultOrder[asm] = Object.keys(lengths[asm]).sort(
      (a, b) => lengths[asm][b] - lengths[asm][a],
    );
  }

  const buildLayout = ({ asm, order, orient = {} }) => {
    let seqs = {};
    let buckets = [];
    let offset = 0;
    order.forEach((seq, index) => {
      let length = lengths[asm][seq];
      let seqOrient = orient[seq] || 1;
      seqs[seq] = {
        index,
        length,
        orient: seqOrient,
        offset: seqOrient > 0 ? offset : offset + length,
      };
      buckets.push(offset);
      offset += length;
    });
    buckets.push(offset);
    return { seqs, buckets, labels: order, domain: [0, offset] };
  };

  const toGlobal = (layout, seq, value) => {
    let { offset, orient } = layout.seqs[seq];
    return orient > 0 ? offset + value : offset - value;
  };

  const alignAssembly = ({ refAsm, refLayout, cmpAsm }) => {
    let groupScores = {};
    let refStarts = {};
    for (let [refSeq, feats] of Object.entries(seqsOf(refAsm))) {
      for (let { group, start } of feats) {
        let position = toGlobal(refLayout, refSeq, start);
        groupScores[group] = position;
        if (!refStarts[group]) {
          refStarts[group] = {};
        }
        if (!refStarts[group][refSeq]) {
          refStarts[group][refSeq] = [];
        }
        refStarts[group][refSeq].push(position);
      }
    }
    let scores = {};
    let orient = {};
    for (let cmpSeq of defaultOrder[cmpAsm]) {
      let seqArray = [];
      let pairs = {};
      for (let { group, start } of seqsOf(cmpAsm)[cmpSeq]) {
        if (groupScores[group] === undefined) {
          continue;
        }
        for (let [refSeq, positions] of Object.entries(refStarts[group])) {
          if (!pairs[refSeq]) {
            pairs[refSeq] = [];
          }
          for (let position of positions) {
            pairs[refSeq].push([position, start]);
          }
        }
        seqArray.push(groupScores[group]);
      }
      if (seqArray.length > 0) {
        scores[cmpSeq] = median(seqArray);
      }
      orient[cmpSeq] = 1;
      if (reorient) {
        let longest = Object.values(pairs).reduce(
          (a, b) => (b.length > a.length ? b : a),
          [],
        );
        if (longest.length >= 2) {
          let { m } = linearRegression(longest);
          if (Number.isFinite(m) && m < 0) {
            orient[cmpSeq] = -1;
          }
        }
      }
    }
    let scored = defaultOrder[cmpAsm]
      .filter((seq) => scores[seq] !== undefined)
      .sort((a, b) => scores[a] - scores[b]);
    let next = 0;
    let order = defaultOrder[cmpAsm].map((seq) =>
      scores[seq] === undefined ? seq : scored[next++],
    );
    return buildLayout({ asm: cmpAsm, order, orient });
  };

  let layouts = [buildLayout({ asm: asms[0], order: defaultOrder[asms[0]] })];
  for (let k = 1; k < asms.length; k++) {
    let refIndex = alignment == "sequential" ? k - 1 : 0;
    layouts.push(
      alignAssembly({
        refAsm: asms[refIndex],
        refLayout: layouts[refIndex],
        cmpAsm: asms[k],
      }),
    );
  }

  let layoutFeatures = layouts.map((layout, k) =>
    layout.labels.flatMap((seq) =>
      (seqsOf(asms[k])[seq] || []).map((feat) => ({
        ...feat,
        sequence_id: seq,
      })),
    ),
  );
  let groupIndex = layoutFeatures.map((feats) => {
    let index = {};
    for (let feat of feats) {
      if (!index[feat.group]) {
        index[feat.group] = [];
      }
      index[feat.group].push(feat);
    }
    return index;
  });

  const catActive = Boolean(bounds.cat) && bounds.cat !== "none";
  // Links from later assemblies take the category of their group's feature in the first assembly.
  const firstCatOf = Object.fromEntries(
    Object.entries(groupIndex[0]).map(([group, feats]) => [
      group,
      feats[0].cat,
    ]),
  );
  // A null category drops the link.
  const linkCat = (from, i) => {
    if (i == 0 || !catActive) {
      return from.cat;
    }
    if (firstCatOf[from.group] !== undefined) {
      return firstCatOf[from.group];
    }
    return bounds.showOther ? "other" : null;
  };

  const pointsFor = (layout, feat) => {
    let a = toGlobal(layout, feat.sequence_id, feat.start);
    let b = toGlobal(layout, feat.sequence_id, feat.end);
    return feat.strand > 0 ? { x: a, x2: b } : { x: b, x2: a };
  };

  const isInIntermediate = (group, i, j) => {
    for (let k = i + 1; k < j; k++) {
      if (groupIndex[k][group]) {
        return true;
      }
    }
    return false;
  };

  const linksBetween = (i, j, passThrough) => {
    let out = [];
    for (let from of layoutFeatures[i]) {
      if (passThrough && isInIntermediate(from.group, i, j)) {
        continue;
      }
      let cat = linkCat(from, i);
      if (cat === null) {
        continue;
      }
      let a = pointsFor(layouts[i], from);
      for (let to of groupIndex[j][from.group] || []) {
        let b = pointsFor(layouts[j], to);
        out.push({
          asm1: i,
          asm2: j,
          x: a.x,
          x2: a.x2,
          y: b.x,
          y2: b.x2,
          sequenceId: from.sequence_id,
          ySequenceId: to.sequence_id,
          featureId: from.feature_id,
          yFeatureId: to.feature_id,
          group: from.group,
          cat,
          strand: from.strand,
          yStrand: to.strand,
          passThrough,
        });
      }
    }
    return out;
  };

  let links = [];
  for (let k = 0; k + 1 < asms.length; k++) {
    links = links.concat(linksBetween(k, k + 1, false));
  }
  if (passThrough) {
    for (let i = 0; i < asms.length; i++) {
      for (let j = i + 2; j < asms.length; j++) {
        links = links.concat(linksBetween(i, j, true));
      }
    }
  }

  let rawData = {};
  for (let feat of layoutFeatures[0]) {
    if (!rawData[feat.cat]) {
      rawData[feat.cat] = [];
    }
  }
  let adjacentLinks = links.filter((link) => link.asm1 == 0 && link.asm2 == 1);
  for (let link of adjacentLinks) {
    rawData[link.cat].push(link);
  }

  let byCat = {};
  let yValuesByCat = {};
  if (bounds.cats) {
    if (bounds.showOther) {
      bounds.cats.push({ key: "other", label: "other" });
    }
    byCat = bounds.cats
      .map((cat) => cat.key)
      .reduce((a, b) => ({ ...a, [b]: layouts[0].buckets.map(() => 0) }), {});
    yValuesByCat = bounds.cats
      .map((cat) => cat.key)
      .reduce(
        (a, b) => ({
          ...a,
          [b]: layouts[0].buckets.map(() => layouts[1].buckets.map(() => 0)),
        }),
        {},
      );
  } else {
    byCat["all features"] = layouts[0].buckets.map(() => 0);
    yValuesByCat["all features"] = layouts[0].buckets.map(() =>
      layouts[1].buckets.map(() => 0),
    );
  }
  let allValues = [];
  let allYValues = [];
  layouts[0].labels.forEach((seq, i) => {
    allValues[i] = (seqsOf(asms[0])[seq] || []).length;
    allYValues[i] = layouts[1].buckets.map(() => 0);
  });
  for (let feat of layoutFeatures[0]) {
    let { index: i } = layouts[0].seqs[feat.sequence_id];
    if (byCat[feat.cat]) {
      byCat[feat.cat][i]++;
    }
  }
  for (let link of adjacentLinks) {
    let { index: i } = layouts[0].seqs[link.sequenceId];
    let { index } = layouts[1].seqs[link.ySequenceId];
    allYValues[i][index]++;
    if (yValuesByCat[link.cat]) {
      yValuesByCat[link.cat][i][index]++;
    }
  }
  let yArr = allYValues.flat();
  let zDomain = [Math.min(...yArr), Math.max(...yArr)];
  bounds = {
    field: asms[0],
    scale: "linear",
    stats: {
      count: xRes.results.length, // update this
      min: layouts[0].domain[0],
      max: layouts[0].domain[1],
    },
    type: "coordinate",
    labels: layouts[0].labels,
    domain: layouts[0].domain,
    tickCount: layouts[0].buckets.length,
    by: bounds.by,
    cat: bounds.cat || "none",
    cats: bounds.cats || [{ key: "all features", label: "all features" }],
  };
  yBounds = {
    field: asms[1],
    scale: "linear",
    stats: {
      count: xRes.results.length, // update this
      min: layouts[1].domain[0],
      max: layouts[1].domain[1],
    },
    type: "coordinate",
    labels: layouts[1].labels,
    domain: layouts[1].domain,
    tickCount: layouts[1].buckets.length,
    by: bounds.by,
    cat: bounds.cat,
    cats: bounds.cats,
  };
  let assemblies = asms.map((asm, k) => ({
    assembly_id: asm,
    alignedTo: k == 0 ? null : alignment == "sequential" ? k - 1 : 0,
    domain: layouts[k].domain,
    buckets: layouts[k].buckets,
    labels: layouts[k].labels,
    orientation: Object.fromEntries(
      layouts[k].labels.map((seq) => [seq, layouts[k].seqs[seq].orient]),
    ),
  }));
  return {
    buckets: layouts[0].buckets,
    allValues,
    byCat,
    rawData,
    fields,
    cat: bounds.cat,
    cats: bounds.cats,
    valueType: "coordinate",
    yValueType: "coordinate",
    yBuckets: layouts[1].buckets,
    yOrientation: assemblies[1].orientation,
    allYValues,
    yValuesByCat,
    zDomain,
    bounds,
    yBounds,
    alignment,
    passThrough,
    assemblies,
    links,
  };
};

export const oxford = async ({
  x,
  cat,
  result,
  taxonomy,
  reorient,
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

  let groupBy = parseCollate(params.query);

  searchFields = [
    ...new Set([
      "sequence_id",
      "start",
      "end",
      "strand",
      groupBy,
      ...searchFields,
    ]),
  ];
  let catRank;
  if (cat) {
    let catField;
    catField = cat.replace(/[^\w_-].+$/, "");
    let catMeta = lookupTypes(catField);
    if (catMeta) {
      xFields = [...new Set([catMeta.name].concat(searchFields))];
    } else {
      catRank = catField;
      xFields = searchFields;
    }
  } else {
    xFields = searchFields;
  }
  fields = xFields;

  let status;
  if (!x || !aInB(xFields, Object.keys(typesMap))) {
    status = {
      success: false,
      error: `unknown field in 'x = ${x}'`,
    };
    for (let field of xFields) {
      if (!typesMap[field]) {
        status.error += `\n  - ${field}`;
      }
    }
    return { status };
  }

  if (!groupBy || !lookupTypes(groupBy)) {
    status = {
      success: false,
      error: `collate field not recognised.\nTry 'collate(assembly_id,busco_gene)'`,
    };
    return { status };
  }

  params.includeEstimates = apiParams.hasOwnProperty("includeEstimates")
    ? apiParams.includeEstimates
    : false;
  params.excludeDirect = apiParams.excludeDirect || [];
  params.excludeDescendant = apiParams.excludeDescendant || [];
  params.excludeAncestral = apiParams.excludeAncestral || [];
  params.excludeMissing = apiParams.excludeMissing || [];

  let xQuery = { ...params };

  let optionalFields = [...fields];
  if (apiParams.fields) {
    optionalFields = optionalFields.concat(apiParams.fields.split(","));
  }
  optionalFields = [...new Set([...optionalFields])];

  let bounds;
  let exclusions = setExclusions(params);
  Object.entries(apiParams).forEach(([key, value]) => {
    if (key.match(/^query[A-Z]$/)) {
      params[key] = value;
    }
  });
  let catOpts, catMeta;
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

  let filteredFields = xFields.filter(
    (field) => lookupTypes(field) && lookupTypes(field).type != "keyword",
  );
  bounds = await getBounds({
    params: { ...params },
    fields: filteredFields,
    summaries,
    result,
    exclusions,
    taxonomy,
    apiParams,
  });
  let asms = parseAssemblies(bounds.query);
  let catBounds = await getBounds({
    params: {
      ...params,
      query: categoryQuery(bounds.query, asms[0]),
    },
    fields: [catMeta.name, ...filteredFields],
    summaries: ["value", ...summaries],
    cat,
    result,
    exclusions,
    taxonomy,
    apiParams,
    opts: catOpts,
    catOpts,
  });

  if (cat && catBounds) {
    bounds.cat = catBounds.cat;
    bounds.cats = catBounds.cats;
    bounds.catType = catBounds.catType;
    bounds.catCount = catBounds.tickCount;
    bounds.by = catBounds.by;
    bounds.showOther = catBounds.showOther;
  }

  xQuery.query = bounds.query;
  let oxford = status
    ? {}
    : await getOxford({
        params,
        fields,
        catRank,
        summaries,
        cat: catMeta.name,
        groupBy,
        asms,
        bounds,
        x,
        result,
        queryId: apiParams.queryId,
        req,
        taxonomy,
        reorient,
        alignment:
          apiParams.ribbonAlign == "sequential" ? "sequential" : "reference",
        passThrough: String(apiParams.ribbonPassThrough) === "true",
      });
  if (oxford && oxford.status && oxford.status.success == false) {
    status = { ...oxford.status };
    oxford = {};
  }
  let yBounds;
  ({ bounds, yBounds } = oxford);
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
        query: bounds.query,
        fields: optionalFields.join(","),
      },
    },
    xQuery,
    xLabel: asms[0],
    yLabel: asms[1],
  };
};
