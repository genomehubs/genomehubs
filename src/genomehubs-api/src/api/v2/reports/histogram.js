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

const getYValues = ({ obj, yField, typesMap }) => {
  let yBuckets, yValues, yValueType;
  let yHist = obj.yHistograms.by_attribute[yField].histogram;
  yHist.buckets.forEach((yObj, j) => {
    if (j == 0) {
      yBuckets = [];
      yValues = [];
      yValueType = valueTypes[typesMap[yField].type] || "float";
    }
    yBuckets.push(yObj.key);
    yValues.push(yObj.doc_count);
  });
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
  let typesMap = await attrTypes({ result, taxonomy });
  params.size = raw;
  // find max and min plus most frequent categories
  let field = fields[0];
  let summary = summaries[0];
  let yField;
  let ySummary;
  let rawData;
  let pointData;
  if (yFields && yFields.length > 0) {
    yField = yFields[0];
    ySummary = ySummaries[0];
    fields = [...new Set(fields.concat(yFields))];
  }
  let valueType = valueTypes[typesMap[field].type] || "float";
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
  let res = await getResults({
    ...params,
    taxonomy,
    fields,
    exclusions,
    ...(raw && cat && !typesMap[cat] && { ranks: cat }),
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
    let yValueType = valueTypes[typesMap[yField].type] || "float";
    if (yValueType == "date") {
      ySumm = dateSummary[ySummary] || "value";
    } else {
      ySumm = ySummary || "value";
    }
    if (yFields.length > 0 && raw) {
      pointData = {};
      res.results.forEach((result) => {
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
        let x = result.result.fields[field][xSumm];
        let y = result.result.fields[yField][ySumm];
        if (valueType == "date") {
          x = Date.parse(x);
        }
        if (yValueType == "date") {
          y = Date.parse(y);
        }
        pointData[cat].push({
          scientific_name: result.result.scientific_name,
          taxonId: result.result.taxon_id,
          x,
          y,
          cat,
        });
      });
    }
  }

  let hist = res.aggs.aggregations[field].histogram;
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

  hist.buckets.forEach((obj, i) => {
    buckets.push(obj.key);
    allValues.push(obj.doc_count);

    if (bounds.showOther) {
      other.push(obj.doc_count);
    }
    if (obj.yHistograms) {
      if (i == 0) {
        allYValues = [];
      }
      let yValues;
      ({ yValues, yBuckets, yValueType } = getYValues({
        obj,
        yField,
        typesMap,
      }));
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
      if (obj.doc_count > 0) {
        zDomain[0] = Math.min(zDomain[0], obj.doc_count);
        zDomain[1] = Math.max(zDomain[1], obj.doc_count);
      }
    }
  });
  if (typesMap[field].type == "date") {
    buckets = scaleBuckets(buckets, "date", bounds);
  } else {
    buckets = scaleBuckets(buckets, bounds.scale, bounds);
  }

  if (yBuckets) {
    if (typesMap[yField].type == "date") {
      yBuckets = scaleBuckets(yBuckets, "date", yBounds);
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
      catBuckets = catHists.by_attribute.by_cat.buckets;
    } else {
      if (bounds.showOther) {
        byCat.other = other;
        yValuesByCat = { other: allOther };
      }
      ranks = [bounds.cat];
      catBuckets = catHists.by_lineage.at_rank.buckets;
    }
    let catObjs = {};
    bounds.cats.forEach((obj) => {
      catObjs[obj.key] = obj;
    });
    Object.entries(catBuckets).forEach(([key, obj]) => {
      byCat[key] = [];
      catObjs[key].doc_count = 0;
      obj.histogram.by_attribute[field].histogram.buckets.forEach((bin, i) => {
        byCat[key][i] = bin.doc_count;
        catObjs[key].doc_count += bin.doc_count;
        if (byCat.other) {
          byCat.other[i] -= bin.doc_count;
        }
        if (bin.yHistograms) {
          if (i == 0) {
            if (!yValuesByCat) {
              yValuesByCat = {};
            }
            yValuesByCat[key] = [];
          }
          let { yValues } = getYValues({
            obj: bin,
            yField,
            typesMap,
          });
          if (yValuesByCat.other) {
            yValues.forEach((count, j) => {
              yValuesByCat.other[i][j] -= count;
            });
          }

          yValuesByCat[key].push(yValues);
        }
      });
      if (pointData) {
        rawData[key] = pointData[key];
        delete pointData[key];
      }
    });
    if (byCat.other && byCat.other.reduce((a, b) => a + b, 0) == 0) {
      delete byCat.other;
      delete yValuesByCat.other;
    } else if (pointData) {
      rawData.other = Object.values(pointData).flat();
    }
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
  if (!rank) {
    return {
      status: {
        success: false,
        error: `no rank specified`,
      },
    };
  }
  let typesMap = await attrTypes({ result, taxonomy });

  let searchFields = await parseFields({
    result,
    fields: apiParams.fields,
    taxonomy,
  });
  let { params, fields, summaries } = queryParams({ term: x, result, rank });
  // let exclude = [];
  if (cat && typesMap[cat]) {
    searchFields.push(cat);
    // exclude.push(cat);
  }
  // fields = [...new Set(fields.concat(searchFields))];
  // exclude.push(fields[0]);
  let yTerm = combineQueries(x, y);
  let {
    params: yParams,
    fields: yFields,
    summaries: ySummaries,
  } = queryParams({
    term: yTerm,
    result,
    rank,
  });
  let xQuery = { ...params };

  if (!aInB(fields, Object.keys(typesMap))) {
    return {
      status: {
        success: false,
        error: `unknown field in 'x = ${x}'`,
      },
    };
  }
  if (fields.length == 0 || typesMap[fields[0]].type == "keyword") {
    return {
      status: {
        success: false,
        error: `no numeric or date field in '${x ? `x = ${x}` : "x"}'\ntry ${
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
  if (
    (report == "scatter" && (!y || yFields.length == 0)) ||
    (yFields[0] && typesMap[yFields[0]].type == "keyword")
  ) {
    return {
      status: {
        success: false,
        error: `no numeric or date field in '${y ? `y = ${y}` : "y"}'\ntry ${
          y ? "adding ' AND " : "'"
        }c_value'`,
      },
    };
  }
  let exclusions;

  // params.includeEstimates = apiParams.hasOwnProperty("includeEstimates")
  //   ? apiParams.includeEstimates
  //   : false;
  // params.excludeDirect = apiParams.excludeDirect || [];
  // params.excludeDescendant = apiParams.excludeDescendant || [];
  // params.excludeAncestral = apiParams.excludeAncestral || [];
  // params.excludeMissing = [
  //   ...new Set((apiParams.excludeMissing || []).concat(exclude)),
  // ];

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

  fields = fields.concat(yFields);
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
    if (histograms.byCat && histograms.byCat.other) {
      bounds.cats.push({
        key: "other",
        label: "other",
        doc_count: histograms.byCat.other.reduce((a, b) => a + b, 0),
      });
    }
  }

  // "aggs": {
  //   "aggregations": {
  //     "doc_count": 5708,
  //     "c_value": {
  //       "doc_count": 697,
  //       "stats": {
  //         "count": 697,
  //         "min": 1.009765625,
  //         "max": 2.16015625,
  //         "avg": 1.362065100430416,
  //         "sum": 949.359375
  //       }
  //     }
  //   }
  // },
  let ranks = [rank].flat();
  if (cat && !typesMap[cat]) {
    ranks.push(cat);
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
    ...(y && { yQuery: { query: y } }),
    xLabel: histograms ? histograms.xLabel : fields[0],
    yLabel: histograms ? histograms.yLabel : yFields[0],
  };
};
