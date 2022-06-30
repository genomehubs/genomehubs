import { aInB } from "../functions/aInB";
import { attrTypes } from "../functions/attrTypes";
import { checkResponse } from "../functions/checkResponse";
import { combineQueries } from "../functions/combineQueries";
import { formatJson } from "../functions/formatJson";
import { getBounds } from "./getBounds";
import { getResults } from "../functions/getResults";
import { parseFields } from "../functions/parseFields";
import { queryParams } from "./queryParams";
import { scaleBuckets } from "./scaleBuckets";
import { setAggs } from "./setAggs";
import { setExclusions } from "../functions/setExclusions";
import { valueTypes } from "./valueTypes";

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
        if (doc_count) {
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
  }
  return hist;
};

const getYValues = ({ obj, yField, lookupTypes, stats }) => {
  let yBuckets = [];
  let yValues = [];
  let yValueType = valueTypes[lookupTypes(yField).type] || "float";
  // TODO: use stats here
  let yHist = getHistAggResults(obj.yHistograms.by_attribute[yField], stats);
  if (yValueType == "keyword") {
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
  let catMeta = lookupTypes(cat);
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
      for (let result of res.results) {
        let cat;
        if (bounds.cat) {
          if (bounds.by == "attribute") {
            if (!result.result.fields[bounds.cat]) {
              cat = "missing";
            } else {
              cat = result.result.fields[bounds.cat].value;
              if (Array.isArray(cat)) {
                cat = cat[0].toLowerCase();
              } else {
                cat = result.result.fields[bounds.cat].value.toLowerCase();
              }
            }
          } else if (result.result.ranks) {
            cat = result.result.ranks[bounds.cat];
            if (cat) {
              cat = cat.taxon_id;
            } else {
              cat = "other";
            }
          }
        }
        if (!pointData[cat]) {
          pointData[cat] = [];
        }
        if (!result.result.fields[field] || !result.result.fields[yField]) {
          continue;
        }
        let x = result.result.fields[field][xSumm];
        let y = result.result.fields[yField][ySumm];
        if (valueType == "date") {
          x = Date.parse(x);
        }
        if (yValueType == "date") {
          y = Date.parse(y);
        }
        // console.log({ cat, x, y });
        pointData[cat].push({
          scientific_name: result.result.scientific_name,
          taxonId: result.result.taxon_id,
          x,
          y,
          cat,
        });
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
    } else {
      if (obj.doc_count > 0) {
        zDomain[0] = Math.min(zDomain[0], obj.doc_count);
        zDomain[1] = Math.max(zDomain[1], obj.doc_count);
      }
    }
  });
  if (fieldMeta.type == "date") {
    buckets = scaleBuckets(buckets, "date", bounds);
  } else if (fieldMeta.type == "keyword") {
    buckets.push(undefined);
  } else {
    buckets = scaleBuckets(buckets, bounds.scale, bounds);
  }

  if (yBuckets) {
    // yBuckets = allYBuckets;
    if (yFieldMeta.type == "date") {
      yBuckets = scaleBuckets(yBuckets, "date", yBounds);
    } else if (yFieldMeta.type != "keyword") {
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
        rawData[key] = pointData[key];
        delete pointData[key];
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
    yBuckets,
    yValueType,
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

const updateQuery = ({ params, fields, opts, lookupTypes }) => {
  let meta = lookupTypes(fields[0]);
  let field = meta.name;
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
  if (!typeof options[0] !== "undefined") {
    min = options[0];
  }
  if (!typeof options[1] !== "undefined") {
    max = options[1];
  }
  for (let i = 0; i < queryArr.length; i++) {
    let qMeta = lookupTypes(queryArr[i].toLowerCase());
    if (qMeta && qMeta.name == field) {
      i++;
      if (min && queryArr[i] && queryArr[i].match(/</)) {
        i++;
        if (queryArr[i] && !isNaN(queryArr[i])) {
          if (min > queryArr[i]) {
            queryArr[i] = min;
            min = undefined;
          }
        }
      } else if (max && queryArr[i] && queryArr[i].match(/>/)) {
        i++;
        if (queryArr[i] && !isNaN(queryArr[i])) {
          if (max < queryArr[i]) {
            queryArr[i] = max;
            max = undefined;
          }
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
  result,
  rank,
  includeEstimates,
  queryString,
  taxonomy,
  xOpts,
  yOpts,
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
  let catMeta = lookupTypes(cat.replace(/[\+\[=].*/, ""));
  if (catMeta && !x.match(catMeta.name)) {
    searchFields.push(catMeta.name);
    x += ` AND ${catMeta.name}`;
    // exclude.push(cat);
  }
  let xTerm = combineQueries(y, x);
  let { params, fields, summaries } = await queryParams({
    term: xTerm,
    result,
    rank,
    taxonomy,
  });
  updateQuery({ params, fields, opts: xOpts, lookupTypes });
  // let exclude = [];

  fields = [...new Set(fields.concat(searchFields))];
  // exclude.push(fields[0]);
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
    updateQuery({ params: yParams, fields: yFields, opts: yOpts, lookupTypes });
    updateQuery({ params: params, fields: yFields, opts: yOpts, lookupTypes });
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
  if (yFields && yFields.length > 0) {
    // exclude.push(yFields[0]);
    if (!aInB(yFields, Object.keys(typesMap))) {
      return {
        status: {
          success: false,
          error: `unknown field in 'y = ${y}'`,
        },
      };
    }
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
  let bounds = await getBounds({
    params: { ...params },
    fields,
    summaries,
    cat,
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
  if (cat && (!bounds.cats || bounds.cats.length == 0)) {
    return {
      status: {
        success: false,
        error: `unknown field in 'cat = ${cat}'`,
      },
    };
  }
  let histograms, yBounds;
  if (yFields && yFields.length > 0) {
    yBounds = await getBounds({
      params: { ...yParams },
      fields: yFields,
      summaries: ySummaries,
      cat,
      result,
      exclusions,
      taxonomy,
      apiParams,
      opts: yOpts,
    });
  }
  if (bounds && (!bounds.cats || bounds.cats.length > 0)) {
    let threshold = scatterThreshold >= 0 ? scatterThreshold : 10000;
    histograms = await getHistogram({
      params,
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

  return {
    status: { success: true },
    report: {
      histograms,
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
    xLabel: histograms ? histograms.xLabel : fields[0],
  };
};
