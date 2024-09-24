import { aInB } from "../functions/aInB.js";
import { attrTypes } from "../functions/attrTypes.js";
import { checkResponse } from "../functions/checkResponse.js";
import { combineQueries } from "../functions/combineQueries.js";
import { formatJson } from "../functions/formatJson.js";
import { getBounds } from "./getBounds.js";
import { getResults } from "../functions/getResults.js";
import { parseCatOpts } from "../functions/parseCatOpts.js";
import { parseFields } from "../functions/parseFields.js";
import { queryParams } from "./queryParams.js";
import { scaleBuckets } from "./scaleBuckets.js";
import { setAggs } from "./setAggs.js";
import { setExclusions } from "../functions/setExclusions.js";
import { valueTypes } from "./valueTypes.js";

const getHistAggResults = (aggs, stats) => {
  let hist = aggs.histogram;
  if (!hist) {
    return;
  }
  if (hist.by_attribute) {
    if (hist.by_attribute.by_cat.by_value.cats) {
      hist = hist.by_attribute.by_cat.by_value.cats;
    } else if (stats && stats.cats) {
      let cats = [...stats.cats];
      if (stats.showOther) {
        cats.push({ key: "other" });
      }
      let buckets = [];
      cats.forEach(({ key }) => {
        let doc_count = 0;
        if (hist.by_attribute.by_cat.by_value.buckets[key]) {
          doc_count = hist.by_attribute.by_cat.by_value.buckets[key].doc_count;
        }
        let yHistograms;
        if (doc_count && hist.by_attribute.by_cat.by_value.buckets[key].cats) {
          yHistograms =
            hist.by_attribute.by_cat.by_value.buckets[key].cats.buckets[0]
              .yHistograms;
        }
        buckets.push({ key, doc_count, yHistograms });
      });
      hist = { buckets };
    } else {
      hist = {
        buckets: Object.entries(hist.by_attribute.by_cat.by_value.buckets).map(
          ([key, obj]) => ({ key, doc_count: obj.doc_count })
        ),
      };
    }
  } else if (hist.by_lineage) {
    // TODO: support lineage category histogram
    // console.log(hist);
  } else {
    // console.log(JSON.stringify(hist, null, 4));
  }
  return hist;
};

const getYValues = ({ obj, yField, lookupTypes, stats }) => {
  let yBuckets = [];
  let yValues = [];
  let yValueType = valueTypes[lookupTypes(yField).type] || "float";
  // TODO: use stats here
  let yHist = getHistAggResults(obj.yHistograms.by_attribute[yField], stats);
  if (yValueType == "keyword" && stats.cats) {
    let bucketMap = {};
    stats.cats.forEach((obj, i) => {
      yBuckets.push(obj.key);
      bucketMap[obj.key] = i;
      yValues.push(0);
    });
    if (stats.showOther) {
      yBuckets.push("other");
      bucketMap["other"] = stats.cats.length;
      yValues.push(0);
    }
    yBuckets.push(undefined);
    if (yHist) {
      yHist.buckets.forEach((yObj) => {
        yValues[bucketMap[yObj.key]] = yObj.doc_count;
      });
    }
  } else {
    yHist.buckets.forEach((yObj, j) => {
      yBuckets.push(yObj.key);
      yValues.push(yObj.doc_count);
    });
  }
  if (yHist) {
  }
  return { yValues, yBuckets, yValueType };
};

const getHistogram = async ({
  params,
  cat,
  fields,
  rank,
  summaries,
  result,
  exclusions,
  bounds,
  yFields,
  yBounds,
  ySummaries,
  raw,
  taxonomy,
}) => {
  let { lookupTypes } = await attrTypes({ result, taxonomy });
  params.size = raw;
  // find max and min plus most frequent categories
  let fieldMeta = lookupTypes(fields[0]);
  let field = fieldMeta.name;
  let summary = summaries[0];
  let yField;
  let yFieldMeta;
  let ySummary;
  let rawData;
  let pointData;
  if (bounds.cat && bounds.by == "attribute") {
    if (!bounds.showOther) {
      let parts = params.query.split(/\s+AND\s+/i);
      let filtered = parts.filter((part) => part != bounds.cat);
      params.query = `${filtered.join(" AND ")} AND ${bounds.cat}=${bounds.cats
        .map(({ key }) => key)
        .join(",")}`;
    }
    fields = [...new Set([...fields, bounds.cat])];
  }
  if (yFields && yFields.length > 0) {
    yFieldMeta = lookupTypes(yFields[0]);
    yField = yFieldMeta.name;
    ySummary = ySummaries[0];
    fields = [...new Set(fields.concat(yFields))];
  }
  let valueType = valueTypes[fieldMeta.type] || "float";
  params.aggs = await setAggs({
    field,
    summary,
    result,
    taxonomy,
    histogram: true,
    bounds,
    yField,
    yBounds,
    ySummary,
  });

  let catMeta = lookupTypes((cat || "").replace(/[\+\[=].*/, ""));
  let res = await getResults({
    ...params,
    taxonomy,
    fields,
    exclusions,
    ...(raw && cat && !catMeta && { ranks: cat.replace(/[\+\[=].*/, "") }),
  });
  if (!res.status.success) {
    return { status: res.status };
  }
  let xSumm, ySumm;
  const dateSummary = {
    min: "from",
    max: "to",
  };
  if (valueType == "date") {
    xSumm = dateSummary[summary] || "value";
  } else {
    xSumm = summary || "value";
  }
  if (yField && yFields) {
    let yValueType = valueTypes[yFieldMeta.type] || "float";
    if (yValueType == "date") {
      ySumm = dateSummary[ySummary] || "value";
    } else {
      ySumm = ySummary || "value";
    }
    if (yFields.length > 0 && raw) {
      pointData = {};
      let xKeys = new Set(
        (bounds.stats.cats || []).map((obj) => obj.key.toLowerCase())
      );
      let yKeys = new Set(
        (yBounds.stats.cats || []).map((obj) => obj.key.toLowerCase())
      );
      for (let result of res.results) {
        let cats;
        if (bounds.cat) {
          if (bounds.by == "attribute") {
            if (!result.result.fields[bounds.cat]) {
              cats = ["missing"];
            } else {
              let cat = result.result.fields[bounds.cat].value;
              if (Array.isArray(cat)) {
                cats = cat.map((c) => c.toLowerCase());
              } else {
                cats = [cat.toLowerCase()];
              }
            }
          } else if (result.result.ranks) {
            cats = [result.result.ranks[bounds.cat]];
            if (cats[0]) {
              cats[0] = cats[0].taxon_id;
            } else {
              cats = ["other"];
            }
          }
        }
        for (let cat of cats || ["all data"]) {
          if (!pointData[cat]) {
            pointData[cat] = [];
          }
          if (!result.result.fields[field] || !result.result.fields[yField]) {
            continue;
          }
          let x = result.result.fields[field][xSumm];
          if (
            valueType == "keyword" &&
            xSumm == "value" &&
            !xKeys.has(x.toLowerCase())
          ) {
            continue;
          }
          let y = result.result.fields[yField][ySumm];
          if (
            yValueType == "keyword" &&
            ySumm == "value" &&
            !yKeys.has(y.toLowerCase())
          ) {
            continue;
          }
          if (valueType == "date") {
            x = Date.parse(x);
          }
          if (yValueType == "date") {
            y = Date.parse(y);
          }
          pointData[cat].push({
            ...(result.result.scientific_name && {
              scientific_name: result.result.scientific_name,
            }),
            ...(result.result.taxon_id && { taxonId: result.result.taxon_id }),
            x,
            y,
            cat,
          });
        }
      }
    }
  }

  let hist = getHistAggResults(res.aggs.aggregations[field], bounds.stats);
  if (!hist) {
    return;
  }
  if (pointData) {
    rawData = {};
  }
  let buckets = [];
  let allValues = [];
  let yBuckets;
  let ranks;
  let allYValues;
  let yValuesByCat;
  let yValueType;
  let zDomain = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
  let other = [];
  let allOther = [];
  let translations = {};
  hist.buckets.forEach((obj, i) => {
    buckets.push(obj.key);
    allValues.push(obj.doc_count);

    if (bounds.showOther) {
      other.push(obj.doc_count);
    }

    if (yField) {
      if (!allYValues) {
        allYValues = [];
      }
      if (obj.yHistograms) {
        let yValues;
        ({ yValues, yBuckets, yValueType } = getYValues({
          obj,
          yField,
          lookupTypes,
          stats: yBounds.stats,
          other: yBounds.showOther,
        }));
        // allYBuckets = [...new Set(allYBuckets.concat(yBuckets))];
        if (obj.doc_count > 0) {
          let min = Math.min(...yValues);
          let max = Math.max(...yValues);
          zDomain[0] = Math.min(zDomain[0], min);
          zDomain[1] = Math.max(zDomain[1], max);
        }
        allYValues.push(yValues);
        if (bounds.showOther) {
          allOther.push([...yValues]);
        }
      } else {
        allYValues.push([]);
      }
    } else if (obj.doc_count > 0) {
      zDomain[0] = Math.min(zDomain[0], obj.doc_count);
      zDomain[1] = Math.max(zDomain[1], obj.doc_count);
    }
  });
  if (fieldMeta.type == "date") {
    buckets = scaleBuckets(buckets, "date", bounds);
  } else if (fieldMeta.type == "keyword" && summaries[0] != "length") {
    buckets.push(undefined);
  } else {
    buckets = scaleBuckets(buckets, bounds.scale, bounds);
  }

  if (yBuckets) {
    // yBuckets = allYBuckets;
    if (yFieldMeta.type == "date") {
      yBuckets = scaleBuckets(yBuckets, "date", yBounds);
    } else if (yFieldMeta.type != "keyword" && summaries[0] != "length") {
      yBuckets = scaleBuckets(yBuckets, yBounds.scale, yBounds);
    } else {
      yBuckets = scaleBuckets(yBuckets, yBounds.scale, yBounds);
    }
  }
  let catHists = res.aggs.aggregations[field].categoryHistograms;
  let byCat;
  if (catHists) {
    let catBuckets;
    byCat = {};
    if (bounds.by == "attribute") {
      fields.push(bounds.cat);
      fields = [...new Set(fields)];
      catBuckets = catHists.by_attribute.by_cat.by_value.buckets;
    } else {
      ranks = [bounds.cat];
      catBuckets = catHists.by_lineage.at_rank.buckets;
    }
    if (bounds.showOther) {
      byCat.other = other;
      yValuesByCat = { other: allOther };
    }

    let catObjs = {};
    if (bounds.showOther) {
      bounds.cats.push({
        key: "other",
        label: "other",
      });
    }
    bounds.cats.forEach((obj) => {
      catObjs[obj.key] = obj;
    });

    for (let [key, obj] of Object.entries(catBuckets)) {
      if (key == "other") {
        continue;
      }
      byCat[key] = [];
      catObjs[key].doc_count = 0;
      // TODO: support categories here too
      let nestedHist = getHistAggResults(
        obj.histogram.by_attribute[field],
        bounds.stats
      );
      nestedHist.buckets.forEach((bin, i) => {
        byCat[key][i] = bin.doc_count;
        catObjs[key].doc_count += bin.doc_count;
        if (byCat.other) {
          byCat.other[i] -= bin.doc_count;
        }
        if (yField) {
          if (!yValuesByCat) {
            yValuesByCat = {};
          }
          if (!yValuesByCat[key]) {
            yValuesByCat[key] = [];
          }
          if (bin.yHistograms) {
            let { yValues } = getYValues({
              obj: bin,
              yField,
              lookupTypes,
              stats: yBounds.stats,
            });
            if (yValuesByCat.other) {
              yValues.forEach((count, j) => {
                yValuesByCat.other[i][j] -= count;
              });
            }
            yValuesByCat[key].push(yValues);
          } else {
            yValuesByCat[key].push([]);
          }
        }
      });
      if (pointData) {
        rawData[key] = pointData[key.toLowerCase()];
        delete pointData[key.toLowerCase()];
      }
    }
    if (pointData && byCat.other) {
      rawData.other = Object.values(pointData)
        .flat()
        .map((obj) => {
          obj.cat = "other";
          return obj;
        });
    }
    // if (byCat.other && byCat.other.reduce((a, b) => a + b, 0) == 0) {
    //   delete byCat.other;
    //   delete yValuesByCat.other;
    // } else if (pointData) {
    //   rawData.other = Object.values(pointData).flat();
    // }
  } else if (pointData) {
    rawData = Object.values(pointData).flat();
  }
  let xLabel, yLabel;
  if (xSumm && xSumm != "value") {
    xLabel = `${summaries[0]}(${field})`;
  } else {
    xLabel = field;
  }
  if (yField) {
    if (ySumm && ySumm != "value") {
      yLabel = `${ySummaries[0]}(${yField})`;
    } else {
      yLabel = yField;
    }
  }

  return {
    buckets,
    allValues,
    byCat,
    rawData,
    valueType,
    summary,
    yBuckets,
    yValueType,
    ySummary,
    allYValues,
    yValuesByCat,
    zDomain,
    params,
    fields,
    ranks,
    xLabel,
    yLabel,
  };
};

const updateQuery = ({ params, fields, summaries, opts, lookupTypes }) => {
  let meta = lookupTypes(fields[0]);
  let field = meta.name;
  if (summaries[0] != meta.processed_simple) {
    field = `${summaries[0]}(${field})`;
  }
  if (!meta || !opts || meta.type == "keyword") {
    return;
  }
  let queryArr = (params.query || "").split(
    /(\s*[<>=]+\s*|\s+AND\s+|\s+and\s+)/
  );
  let options = opts.split(";");
  if (options.length == 1) {
    options = options[0].split(",");
  }
  let min, max;
  if (typeof options[0] !== "undefined") {
    min = options[0];
  }
  if (typeof options[1] !== "undefined") {
    max = options[1];
  }
  for (let i = 0; i < queryArr.length; i++) {
    let qMeta = lookupTypes(queryArr[i].toLowerCase());
    if (qMeta && qMeta.name == field) {
      i++;
      if (min && queryArr[i] && queryArr[i].match(/</)) {
        i++;
        if (queryArr[i] && !isNaN(queryArr[i]) && min > queryArr[i]) {
          queryArr[i] = min;
          min = undefined;
        }
      } else if (max && queryArr[i] && queryArr[i].match(/>/)) {
        i++;
        if (queryArr[i] && !isNaN(queryArr[i]) && max < queryArr[i]) {
          queryArr[i] = max;
          max = undefined;
        }
      }
    }
  }
  if (min) {
    queryArr = queryArr.concat([" AND ", field, " >= ", min]);
  }
  if (max) {
    queryArr = queryArr.concat([" AND ", field, " <= ", max]);
  }
  params.query = queryArr.join("");
};

export const histogram = async ({
  x,
  y,
  cat,
  catToX,
  result,
  rank,
  includeEstimates,
  queryString,
  taxonomy,
  xOpts = ";;",
  yOpts = ";;",
  scatterThreshold,
  report,
  apiParams,
}) => {
  if (result == "taxon" && !rank) {
    return {
      status: {
        success: false,
        error: `no rank specified`,
      },
    };
  }
  let { typesMap, lookupTypes } = await attrTypes({ result, taxonomy });

  let searchFields = await parseFields({
    result,
    fields: apiParams.fields,
    taxonomy,
  });
  let catOpts, catMeta;
  ({
    cat,
    catOpts,
    query: x,
    catMeta,
  } = parseCatOpts({
    cat,
    query: x,
    searchFields,
    lookupTypes,
  }));
  console.log({
    cat,
    query: x,
    searchFields,
    lookupTypes,
  });
  // if (catMeta) {
  //   cat = catMeta.name;
  // }
  let xTerm = combineQueries(y, x);
  let { params, fields, summaries } = await queryParams({
    term: xTerm,
    result,
    rank,
    taxonomy,
  });
  updateQuery({
    params,
    fields,
    summaries,
    opts: xOpts.replace(/^nsort/, ""),
    lookupTypes,
  });
  fields = [...new Set(fields.concat(searchFields))];
  let yTerm, yFields, ySummaries;
  let yParams = {};
  if (y) {
    yTerm = combineQueries(params.query, y);
    ({
      params: yParams,
      fields: yFields,
      summaries: ySummaries,
    } = await queryParams({
      term: yTerm,
      result,
      rank,
      taxonomy,
    }));
    updateQuery({
      params: yParams,
      fields: yFields,
      summaries: ySummaries,
      opts: yOpts.replace(/^nsort/, ""),
      lookupTypes,
    });
    updateQuery({
      params: params,
      fields: yFields,
      summaries: ySummaries,
      opts: yOpts.replace(/^nsort/, ""),
      lookupTypes,
    });
  }

  let xQuery = { ...params };

  if (!aInB(fields, Object.keys(typesMap))) {
    return {
      status: {
        success: false,
        error: `unknown field in 'x = ${x}'`,
      },
    };
  }

  if (fields.length == 0) {
    return {
      status: {
        success: false,
        error: `no field in '${x ? `x = ${x}` : "x"}'\ntry ${
          x ? "adding ' AND " : "'"
        }assembly_span'`,
      },
    };
  }
  if (yFields && yFields.length > 0 && !aInB(yFields, Object.keys(typesMap))) {
    return {
      status: {
        success: false,
        error: `unknown field in 'y = ${y}'`,
      },
    };
  }

  if (report == "scatter" && (!y || yFields.length == 0)) {
    return {
      status: {
        success: false,
        error: `no field in '${y ? `y = ${y}` : "y"}'\ntry ${
          y ? "adding ' AND " : "'"
        }c_value'`,
      },
    };
  }
  let exclusions;

  params.includeEstimates = apiParams.hasOwnProperty("includeEstimates")
    ? apiParams.includeEstimates
    : false;
  yParams.includeEstimates = params.includeEstimates;
  params.excludeDirect = apiParams.excludeDirect || [];
  params.excludeDescendant = apiParams.excludeDescendant || [];
  params.excludeAncestral = apiParams.excludeAncestral || [];
  if (params.excludeMissing && params.excludeMissing.length > 0) {
    if (apiParams.excludeMissing) {
      params.excludeMissing = params.excludeMissing.concat(
        apiParams.excludeMissing
      );
    }
  } else {
    params.excludeMissing = apiParams.excludeMissing || [];
  }

  yParams.excludeDirect = apiParams.excludeDirect || [];
  yParams.excludeDescendant = apiParams.excludeDescendant || [];
  yParams.excludeAncestral = apiParams.excludeAncestral || [];
  if (yParams.excludeMissing && yParams.excludeMissing.length > 0) {
    if (apiParams.excludeMissing) {
      yParams.excludeMissing = yParams.excludeMissing.concat(
        apiParams.excludeMissing
      );
    }
  } else {
    yParams.excludeMissing = apiParams.excludeMissing || [];
  }

  if (yFields) {
    fields = fields.concat(yFields);
  }
  fields = [...new Set(fields)];
  exclusions = setExclusions(params);
  let inputQueries = Object.entries(apiParams)
    .filter(([key, value]) => key.match(/query[A-Z]+/))
    .reduce((a, [key, value]) => ({ ...a, [key]: value }), {});
  let bounds = await getBounds({
    params: { ...params, ...inputQueries },
    fields,
    summaries,
    result,
    exclusions,
    taxonomy,
    apiParams,
    opts: xOpts,
  });

  if (!bounds) {
    return {
      status: {
        success: false,
        error:
          "unable to calculate bounds" +
          (rank ? "\ntry a lower taxonomic rank" : ""),
      },
    };
  }
  console.log(cat);
  let catBounds = await getBounds({
    params: { ...params, ...inputQueries },
    fields,
    summaries,
    cat,
    result,
    exclusions,
    taxonomy,
    apiParams,
    // opts: xOpts,
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

  let histograms, yBounds;
  if (yFields && yFields.length > 0) {
    yBounds = await getBounds({
      params: { ...yParams, ...inputQueries },
      fields: yFields,
      summaries: ySummaries,
      result,
      exclusions,
      taxonomy,
      apiParams,
      opts: yOpts,
    });
  }
  if (bounds && (!bounds.cats || bounds.cats.length > 0 || bounds.catType)) {
    let threshold = scatterThreshold >= 0 ? scatterThreshold : 10000;
    histograms = await getHistogram({
      params: { ...params, ...inputQueries },
      fields,
      rank,
      summaries,
      cat,
      result,
      exclusions,
      bounds,
      yFields,
      yBounds,
      ySummaries,
      taxonomy,
      raw: bounds.stats.count < threshold ? threshold : 0,
    });
  }

  let ranks = [rank].flat();
  if (cat && !catMeta) {
    ranks.push(cat);
  }
  if (bounds && bounds.stats && bounds.stats.showOther) {
    bounds.stats.cats.push({ key: "other", label: "other" });
  }
  if (yBounds && yBounds.stats && yBounds.stats.showOther) {
    yBounds.stats.cats.push({ key: "other", label: "other" });
  }

  let { buckets, allValues, labels, byCat, valueType, zDomain } = histograms;
  if (catToX && bounds.by == "lineage" && bounds.scale == "ordinal") {
    buckets = [];
    allValues = [];
    labels = [];
    byCat = {};
    zDomain = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
    valueType = "lineage";

    for (let b of histograms.buckets) {
      if (b) {
        byCat[b] = [];
      }
    }
    for (let [k, a] of Object.entries(histograms.byCat)) {
      let sum = 0;
      a.forEach((v, i) => {
        sum += v;
        byCat[histograms.buckets[i]].push(v);
      });
      allValues.push(sum);
      zDomain = [Math.min(zDomain[0], sum), Math.max(zDomain[1], sum)];
      buckets.push(k);
    }
    buckets.push(undefined);

    for (cat of bounds.cats) {
      labels[buckets.indexOf(cat.key)] = cat.label;
    }
    if (bounds.showOther) {
      labels[buckets.indexOf("other")] = "other";
    }
    let boundStats = {
      cats: bounds.cats,
      cat: bounds.cat,
      by: bounds.by,
      count: bounds.stats.count, // TODO: change this
      size: bounds.cats.length,
      showOther: bounds.showOther,
    };

    bounds = {
      ...bounds,
      ...bounds.stats,
      cat: bounds.field,
      field: bounds.cat,
      labels,
      stats: { ...boundStats },
    };
  }

  return {
    status: { success: true },
    report: {
      histograms: {
        ...histograms,
        buckets,
        allValues,
        byCat,
        zDomain,
        valueType,
      },
      ...bounds,
      bounds,
      yBounds,
      xQuery: {
        ...xQuery,
        fields: fields.join(","),
        ranks,
      },
      x: histograms ? histograms.allValues.reduce((a, b) => a + b, 0) : 0,
    },
    xQuery,
    ...(y && {
      yQuery: { query: y },
      yLabel: histograms ? histograms.yLabel : yFields[0],
    }),
    xLabel: (valueType = "lineage"
      ? bounds.stats.cat || histograms.xLabel
      : fields[0]),
  };
};
