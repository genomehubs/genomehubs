import { apiUrl, setApiStatus } from "../reducers/api";
import formats, { setInterval } from "../functions/formats";
import {
  getController,
  resetController,
  setMessage,
} from "../reducers/message";
import {
  getReports,
  getReportsFetching,
  receiveReport,
  requestReport,
} from "../reducers/report";
import {
  getSearchIndex,
  getSearchResults,
  getSearchTerm,
  plurals,
} from "../reducers/search";

import { byIdSelectorCreator } from "../reducers/selectorCreators";
import { checkProgress } from "./checkProgress";
import { createCachedSelector } from "re-reselect";
import { createSelector } from "reselect";
// import { format } from "d3-format";
import { getTypes } from "../reducers/types";
import { mapThreshold } from "../reducers/map";
import { nanoid } from "nanoid";
import { processTree } from "./tree";
import qs from "../functions/qs";
import { scaleOrdinal } from "d3-scale";
import store from "../store";
import { treeThreshold } from "../reducers/tree";

export const sortReportQuery = ({ queryString, options, ui = true }) => {
  const reportTerms = {
    result: true,
    report: true,
    query: { not: new Set(["srces"]), as: "x" },
    x: { not: new Set(["srces"]) },
    y: { in: new Set(["scatter", "table", "tree", "arc"]) },
    z: { in: new Set(["arc", "scatter"]) },
    cat: { not: new Set(["sources", "arc"]) },
    rank: { not: new Set(["oxford", "srces", "tree"]) },
    ranks: { in: new Set(["tree"]) },
    levels: { in: new Set(["tree"]), ui: true },
    names: { in: new Set(["tree"]) },
    fields: {
      in: new Set([
        "histogram",
        "map",
        "oxford",
        "scatter",
        "sources",
        "table",
        "tree",
      ]),
    },
    collapseMonotypic: { in: new Set(["tree"]) },
    highlight: { in: new Set(["table"]), ui: true },
    colorPalette: { not: new Set(["sources"]), ui: true },
    includeEstimates: true,
    excludeAncestral: true,
    excludeDescendant: true,
    excludeMissing: true,
    excludeDirect: true,
    taxonomy: true,
    caption: true,
    queryA: true,
    queryB: true,
    queryC: true,
    queryD: true,
    queryE: true,
    queryF: true,
    queryG: true,
    queryH: true,
    queryI: true,
    queryJ: true,
    xOpts: { in: new Set(["histogram", "scatter", "table"]) },
    yOpts: { in: new Set(["scatter", "table", "tree"]) },
    compactLegend: { in: new Set(["histogram", "oxford", "scatter"]) },
    catToX: { in: new Set(["histogram"]) },
    compactWidth: { in: new Set(["histogram", "oxford", "scatter"]) },
    highlightArea: { in: new Set(["scatter"]), ui: true },
    scatterThreshold: { in: new Set(["scatter"]) },
    treeStyle: { in: new Set(["tree"]), ui: true },
    plotRatio: { in: new Set(["oxford", "scatter"]), ui: true },
    yScale: { in: new Set(["histogram"]), ui: true },
    zScale: { in: new Set(["scatter"]), ui: true },
    stacked: { in: new Set(["histogram", "scatter"]), ui: true },
    pointSize: {
      in: new Set(["histogram", "oxford", "scatter", "tree", "arc"]),
      ui: true,
    },
    cumulative: { in: new Set(["histogram", "table"]), ui: true },
    // reversed: { in: new Set(["table"]), ui: true },
    mapThreshold: { in: new Set(["map"]) },
    treeThreshold: { in: new Set(["tree"]) },
    queryId: {
      in: new Set([
        "histogram",
        "map",
        "oxford",
        "scatter",
        "table",
        "tree",
        "arc",
      ]),
    },
    release: true,
    indent: false,
  };
  if (!options) {
    options = qs.parse(queryString);
  }
  let newOptions = {};
  let report = options.report;
  Object.entries(options).forEach(([key, value]) => {
    if (reportTerms[key]) {
      if (reportTerms[key] === true) {
        newOptions[key] = value;
      } else if (ui || !reportTerms[key].ui) {
        let newKey = reportTerms[key].as || key;
        if (reportTerms[key].in) {
          if (reportTerms[key].in.has(report)) {
            newOptions[newKey] = value;
          }
        } else {
          if (!reportTerms[key].not.has(report)) {
            newOptions[newKey] = value;
          }
        }
      }
    }
  });
  return qs.stringify(newOptions);
};

export function fetchReport({
  reportId,
  reload,
  report,
  hideMessage,
  inModal,
}) {
  return async function (dispatch) {
    const state = store.getState();
    const fetching = getReportsFetching(state);
    const reports = getReports(state);
    if (!reload) {
      if (reports[reportId] || fetching[reportId]) {
        return;
      }
    }
    dispatch(requestReport(reportId));
    let queryString = reportId;
    if (
      queryString.match("report=tree") &&
      !queryString.match("treeThreshold")
    ) {
      queryString += `&treeThreshold=${treeThreshold}`;
    }
    if (queryString.match("report=map") && !queryString.match("mapThreshold")) {
      queryString += `&mapThreshold=${mapThreshold}`;
    }
    let apiQueryString = sortReportQuery({ queryString, ui: false });
    const queryId = nanoid(10);
    let url = `${apiUrl}/report?${apiQueryString.replace(
      /^\?/,
      ""
    )}&queryId=${queryId}`;
    try {
      let json;
      let status;
      const interval = checkProgress({
        queryId,
        delay: inModal ? 1000 : 30000,
        dispatch,
        message: hideMessage ? undefined : `Fetching ${report} report`,
      });
      try {
        // dispatch(
        //   setMessage({
        //     message: `Fetching ${report} report`,
        //     duration: 5000,
        //     severity: "info",
        //   })
        // );
        const response = await fetch(url, {
          signal: getController(state).signal,
        });
        json = await response.json();
        clearInterval(interval);
      } catch (error) {
        clearInterval(interval);
        if (getController(state).signal.aborted && !hideMessage) {
          dispatch(
            setMessage({
              message: `Cancelled`,
              duration: 5000,
              severity: "warning",
            })
          );
          status = { success: false, error: "Request cancelled" };
        } else {
          if (!hideMessage) {
            dispatch(
              setMessage({
                message: `Failed to fetch ${report} report`,
                duration: 5000,
                severity: "error",
              })
            );
          }

          status = { success: false, error: "Unexpected error" };
          console.log(error);
        }
        dispatch(resetController());
        json = {
          status,
          report: {
            name: report,
            report: { queryString, tree: { status } },
          },
        };
        dispatch(receiveReport({ json, reportId }));
      }
      if (!status) {
        clearInterval(interval);
        // let success;
        if (json.report && json.report.report) {
          json.report.report.queryString = queryString;
          // if (json.report.report[report] && json.report.report[report].status) {
          //   success = json.report.report[report].status.success;
          // }
        }
        // if (success) {
        //   dispatch(
        //     setMessage({
        //       message: `Parsing ${report} report`,
        //       duration: 5000,
        //       severity: "info",
        //     })
        //   );
        // } else {
        if (!hideMessage) {
          dispatch(
            setMessage({
              duration: 0,
              severity: "info",
            })
          );
        }

        // }
        dispatch(receiveReport({ json, reportId }));
        // dispatch(setApiStatus(true));
      }
    } catch (err) {
      return dispatch(setApiStatus(false));
    }
  };
}

const gaussianRand = () => {
  let rand = 0;
  for (var i = 0; i < 6; i += 1) {
    rand += Math.random();
  }
  return rand / 6;
};

const gaussianRandom = (start, end) => {
  return Math.floor(start + gaussianRand() * (end - start + 1));
};

const applyJitter = (x, i) => {
  if (i < 1) {
    i *= 100;
    let rand = (gaussianRandom(0, i) - i / 2) / 100;
    return x + rand;
  }
  return x + gaussianRandom(0, i) - i / 2;
};

const expandValues = (obj, arr, buckets, yBuckets) => {
  if (Array.isArray(obj.x) || Array.isArray(obj.y)) {
    // handle arrays of ordinal values
    if (Array.isArray(obj.x)) {
      for (let x of obj.x) {
        if (buckets.includes(x.toLowerCase())) {
          if (Array.isArray(obj.y)) {
            for (let y of obj.y) {
              if (yBuckets.includes(y.toLowerCase())) {
                arr.push({ ...obj, x, y });
              }
            }
          } else {
            arr.push({ ...obj, x });
          }
        }
      }
    } else {
      for (let y of obj.y) {
        if (yBuckets.includes(y.toLowerCase())) {
          arr.push({ ...obj, y });
        }
      }
    }
    return true;
  }
  return false;
};

const processScatter = (scatter, result) => {
  if (!scatter) {
    return {};
  }
  let chartData = [];
  let heatmaps = scatter.histograms;
  if (!heatmaps) {
    return {};
  }
  let searchIndexPlural = plurals[result] || "records";
  let valueType = heatmaps.valueType;
  let cats;
  let lastIndex = heatmaps.buckets.length - 2;
  let xScale = (x) => x;
  let yScale = (y) => y;
  let h, w;
  if (scatter.bounds.scale == "ordinal") {
    xScale = scaleOrdinal()
      .domain(heatmaps.buckets)
      .range(heatmaps.buckets.map((x, i) => i));
    w = 1;
  } else {
    w = heatmaps.buckets[1] - heatmaps.buckets[0];
  }
  if (scatter.yBounds.scale == "ordinal") {
    yScale = scaleOrdinal()
      .domain(heatmaps.yBuckets)
      .range(heatmaps.yBuckets.map((x, i) => i));
    h = 1;
  } else {
    h = heatmaps.yBuckets[1] - heatmaps.yBuckets[0];
  }
  let catSums;
  let pointData;
  let locations = {};
  let hasRawData = heatmaps.rawData ? true : false;
  if (hasRawData) {
    pointData = [];
  }
  if (heatmaps.byCat) {
    catSums = {};
    cats = scatter.cats.map((cat) => cat.label);
    let offsets = [];
    scatter.cats.forEach((cat) => {
      catSums[cat.label] = {
        sum: 0,
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
      };
      let catData = [];
      heatmaps.buckets.forEach((bucket, i) => {
        if (typeof offsets[i] === "undefined") {
          offsets[i] = [];
        }
        if (bucket && scatter.bounds.scale == "ordinal") {
          bucket = bucket.toLowerCase();
        }
        if (i < heatmaps.buckets.length - 1) {
          heatmaps.yBuckets.forEach((yBucket, j) => {
            if (typeof offsets[i][j] === "undefined") {
              offsets[i][j] = 0;
            }
            if (yBucket && scatter.yBounds.scale == "ordinal") {
              yBucket = yBucket.toLowerCase();
            }
            if (
              j < heatmaps.yBuckets.length - 1 &&
              heatmaps.yValuesByCat[cat.key] &&
              heatmaps.yValuesByCat[cat.key][i]
            ) {
              let z = heatmaps.yValuesByCat[cat.key][i][j];
              let count;
              try {
                count = heatmaps.allYValues[i][j];
              } catch (err) {
                count = 0;
                // ignore
              }
              if (z > 0) {
                catData.push({
                  h,
                  w,
                  x: xScale(bucket),
                  y: yScale(yBucket),
                  xBound:
                    scatter.bounds.scale == "ordinal"
                      ? xScale(bucket) + 1
                      : xScale(heatmaps.buckets[i + 1]),
                  yBound:
                    scatter.yBounds.scale == "ordinal"
                      ? yScale(yBucket) + 1
                      : yScale(heatmaps.yBuckets[j + 1]),
                  z,
                  count,
                  offset: offsets[i][j],
                });
                catSums[cat.label].sum += z;
                catSums[cat.label].min = Math.min(catSums[cat.label].min, z);
                catSums[cat.label].max = Math.max(catSums[cat.label].max, z);
                offsets[i][j] += z;
              }
            }
          });
        }
      });
      chartData.push(catData);
      if (hasRawData && pointData && heatmaps && heatmaps.rawData) {
        let points = [];
        if (heatmaps.rawData[cat.key]) {
          let buckets = new Set(heatmaps.buckets);
          let yBuckets = new Set(heatmaps.yBuckets);
          for (let obj of heatmaps.rawData[cat.key]) {
            if (
              expandValues(
                obj,
                heatmaps.rawData[cat.key],
                heatmaps.buckets,
                heatmaps.yBuckets
              )
            ) {
              continue;
            }
            let x;
            let y;
            if (scatter.bounds.scale == "ordinal") {
              let name = obj.x.toLowerCase();
              if (!buckets.has(name)) {
                name = "other";
              }
              x = xScale(name);
              x = applyJitter(x + 0.5, 0.95);
            } else {
              x = xScale(obj.x);
            }
            if (scatter.yBounds.scale == "ordinal") {
              let name = obj.y.toLowerCase();
              if (!yBuckets.has(name)) {
                name = "other";
              }
              y = yScale(name);
              y = applyJitter(y + 0.5, 0.95);
            } else {
              y = yScale(obj.y);
            }
            // TODO: Handle feature highlight with no scientific name
            if (obj.scientific_name) {
              locations[obj.scientific_name.toLowerCase()] = {
                x,
                y,
              };
            }

            points.push({ ...obj, x, y });
          }
        }
        pointData.push(points);
        // pointData.push(heatmaps.rawData[cat.key]);
        // for (let obj of heatmaps.rawData[cat.key]) {
        //   if (Array.isArray(obj.x) || Array.isArray(obj.y)) {
        //     // TODO: handle arrays of ordinal values
        //     continue;
        //   }
        //   locations[obj.scientific_name.toLowerCase()] = {
        //     x:
        //       scatter.bounds.scale == "ordinal"
        //         ? xScale(obj.x.toLowerCase())
        //         : xScale(obj.x),
        //     y:
        //       scatter.yBounds.scale == "ordinal"
        //         ? yScale(obj.y.toLowerCase())
        //         : yScale(obj.y),
        //   };
        // }
      }
    });
  } else {
    cats = [`all ${searchIndexPlural}`];
    catSums = {};
    catSums[`all ${searchIndexPlural}`] = {
      sum: 0,
      min: Number.POSITIVE_INFINITY,
      max: Number.NEGATIVE_INFINITY,
    };
    let catData = [];
    heatmaps.buckets.forEach((bucket, i) => {
      if (bucket && scatter.bounds.scale == "ordinal") {
        bucket = bucket.toLowerCase();
      }
      if (i < heatmaps.buckets.length - 1) {
        heatmaps.yBuckets.forEach((yBucket, j) => {
          if (yBucket && scatter.yBounds.scale == "ordinal") {
            yBucket = yBucket.toLowerCase();
          }
          if (j < heatmaps.yBuckets.length - 1) {
            let z;
            try {
              z = heatmaps.allYValues[i][j];
            } catch (err) {
              z = 0;
              // ignore
            }
            if (z > 0) {
              catData.push({
                h,
                w,
                x: xScale(bucket),
                y: yScale(yBucket),
                xBound:
                  scatter.bounds.scale == "ordinal"
                    ? xScale(bucket) + 1
                    : xScale(heatmaps.buckets[i + 1]),
                yBound:
                  scatter.yBounds.scale == "ordinal"
                    ? yScale(yBucket) + 1
                    : yScale(heatmaps.yBuckets[j + 1]),
                z,
                count: z,
              });
              catSums[`all ${searchIndexPlural}`].sum += z;
              catSums[`all ${searchIndexPlural}`].min = Math.min(
                catSums[`all ${searchIndexPlural}`].min,
                z
              );
              catSums[`all ${searchIndexPlural}`].max = Math.max(
                catSums[`all ${searchIndexPlural}`].max,
                z
              );
            }
          }
        });
      }
    });
    chartData.push(catData);
    if (hasRawData) {
      let points = [];
      for (let obj of heatmaps.rawData) {
        if (
          expandValues(
            obj,
            heatmaps.rawData,
            heatmaps.buckets,
            heatmaps.yBuckets
          )
        ) {
          continue;
        }
        let x;
        let y;
        if (scatter.bounds.scale == "ordinal") {
          if (!heatmaps.buckets.includes(obj.x.toLowerCase())) {
            continue;
          }
          x = xScale(obj.x.toLowerCase());
          x = applyJitter(x + 0.5, 0.95);
        } else {
          x = xScale(obj.x);
        }
        if (scatter.yBounds.scale == "ordinal") {
          if (!heatmaps.yBuckets.includes(obj.y.toLowerCase())) {
            continue;
          }
          y = yScale(obj.y.toLowerCase());
          y = applyJitter(y + 0.5, 0.95);
        } else {
          y = yScale(obj.y);
        }
        // TODO: Handle features with no scientific name
        if (obj.scientific_name) {
          locations[obj.scientific_name.toLowerCase()] = {
            x,
            y,
          };
        }

        points.push({ ...obj, x, y });
      }
      pointData.push(points);
    }
  }
  return { chartData, pointData, cats, catSums, locations };
};

const oneDimensionTable = ({ report }) => {
  let histograms = report.table.histograms;
  let buckets = histograms.buckets.filter((bucket) => bucket && bucket !== 0);
  let headers = [
    { key: report.xLabel, label: report.xLabel },
    { key: "count", label: report.yLabel },
  ];
  let rows = buckets.map((bucket, i) => [
    {
      key: "bucket",
      value: bucket,
      label: bucket,
    },
    {
      key: "count",
      count: histograms.allValues[i] || 0,
    },
  ]);
  return { headers, rows };
};

const twoDimensionTable = ({ report }) => {
  let { table, xLabel, yLabel } = report;
  let { histograms, cat, cats, bounds, yBounds } = table;
  let buckets = histograms.buckets.filter((bucket) => bucket && bucket !== 0);
  let headers = buckets.map((bucket) => ({ key: bucket, label: bucket }));
  let rows = [];
  if (cat) {
    headers.unshift({ key: cat, label: cat });
    for (let catObj of cats) {
      let values = histograms.byCat[catObj.key];
      let row = buckets.map((bucket, i) => {
        let count = values[i] || 0;
        return { key: bucket, count };
      });
      row.unshift({ key: cat, value: catObj.key, label: catObj.label });
      rows.push(row);
    }
  } else if (yLabel) {
    let defaultValue = 0;
    let interval;
    if (
      valueType == "keyword" ||
      valueType == "geo_point" ||
      valueType == "date"
    ) {
      defaultValue = undefined;
      if (valueType == "date") {
        interval = setInterval(
          yBuckets[yBuckets.length - 1] - yBuckets[0],
          yBuckets.length - 1
        );
      }
    }
    let yBuckets = histograms.yBuckets.filter(
      (bucket) => bucket && bucket !== 0
    );
    headers.unshift({ key: yLabel, label: yLabel });
    let values = histograms.allYValues;
    let valueType = yBounds.type;

    yBuckets.forEach((yBucket, j) => {
      let row = buckets.map((bucket, i) => {
        let count = values[i][j] || defaultValue;
        return { key: bucket, count };
      });
      row.unshift({
        key: yBounds.field,
        value: yBucket,
        label: formats(yBucket, valueType, interval),
      });
      rows.push(row);
    });
  }
  return { headers, rows };
};

const processTable = (report) => {
  let { table, xLabel, yQuery } = report;
  let { cat } = table;
  let headers, rows;
  if (cat && yQuery) {
    ({ headers, rows } = twoDimensionTable({ report }));
  } else if (cat || yQuery) {
    ({ headers, rows } = twoDimensionTable({ report }));
  } else if (xLabel) {
    ({ headers, rows } = oneDimensionTable({ report }));
  } else {
    return {};
  }
  return { headers, rows };
};

const processReport = (report, { searchTerm = {} }) => {
  if (!report || !report.name) return {};
  if (report.name == "tree") {
    let { treeStyle } = qs.parse(report.report.queryString);
    let { tree, xQuery, yQuery, bounds, yBounds } = report.report.tree;
    if (!searchTerm) {
      searchTerm = qs.parse(window.location.search.replace(/^\?/, ""));
    }
    return {
      ...report,
      report: {
        ...report.report,
        tree: {
          ...report.report.tree,
          ...processTree({
            nodes: tree,
            bounds,
            yBounds,
            xQuery,
            yQuery,
            treeStyle,
            pointSize: 1 * (searchTerm.pointSize || 15),
          }),
        },
      },
    };
  } else if (report.name == "oxford") {
    return {
      ...report,
      report: {
        ...report.report,
        scatter: {
          ...report.report.oxford,
          ...processScatter(
            report.report.oxford,
            report?.report?.xQuery?.result
          ),
        },
      },
    };
  } else if (report.name == "scatter") {
    return {
      ...report,
      report: {
        ...report.report,
        scatter: {
          ...report.report.scatter,
          ...processScatter(
            report.report.scatter,
            report?.report?.xQuery?.result
          ),
        },
      },
    };
  } else if (report.name == "table") {
    return {
      ...report,
      report: {
        ...report.report,
        table: {
          ...report.report.histogram,
          ...report.report.scatter,
          ...processTable(report.report),
        },
      },
    };
  }
  // if (report.name == "histogram") {
  //   return processHistogram(report);
  // }
  // if (report.name == "terms") {
  //   return processTerms(report);
  // }
  return report;
};

const createSelectorForReportId = byIdSelectorCreator();
const _getReportIdAsMemoKey = (state, _state, reportId) => {
  return reportId;
};

const getReport = (state, reportId) => {
  return state.reports.byId[reportId] || {};
};

export const cacheReportByReportId = createSelectorForReportId(
  _getReportIdAsMemoKey,
  getReport,
  (report) => report
);

export const getReportByReportId = createCachedSelector(
  (state, reportId) => getReport(state, reportId),
  getSearchTerm,
  (_state, reportId) => reportId,
  (report, searchTerm, reportId) => {
    return processReport(report, { reportId, searchTerm });
  }
)((_state, reportId) => reportId);

export const getReportFields = createSelector(
  getSearchIndex,
  getTypes,
  getSearchResults,
  (searchIndex, displayTypes, searchResults) => {
    let fields = [];
    for (let field of searchResults.fields || []) {
      if (displayTypes[searchIndex] && displayTypes[searchIndex][field]) {
        fields.push(displayTypes[searchIndex][field]);
      }
    }
    return fields;
  }
);

const reportOptions = {
  histogram: {
    x: {
      default: "query",
      fieldType: "value",
    },
    rank: {
      default: "query:tax_rank",
    },
  },
  map: {
    x: {
      default: "query",
      fieldType: "value",
    },
    rank: {
      default: "query:tax_rank",
    },
  },
  oxford: {
    x: {
      default: "query",
      fieldType: "value",
    },
    plotRatio: {
      value: 1,
    },
  },
  scatter: {
    x: {
      default: "query",
      fieldType: "value",
    },
    y: {
      fieldType: "value",
    },
    rank: {
      default: "query:tax_rank",
    },
  },
  sources: {
    x: {
      default: "query",
      fieldType: "value",
    },
  },
  table: {
    x: {
      default: "query",
      fieldType: "value",
    },
    y: {
      fieldType: "value",
    },
    rank: {
      default: "query:tax_rank",
    },
  },
  tree: {
    x: {
      default: "query",
      fieldType: "value",
    },
    // y: {
    //   fieldType: "any",
    // },
    treeStyle: {
      default: "treeStyle",
      value: "rect",
    },
  },
  arc: {
    x: {
      default: "query",
      fieldType: "value",
    },
    rank: {
      default: "query:tax_rank",
    },
  },
};

export const getReportDefaults = createSelector(
  getReportFields,
  getSearchTerm,
  (reportFields = [], searchTerm) => {
    let fieldLists = {
      query: [],
      value: [],
      number: [],
      date: [],
      keyword: [],
      any: [],
    };
    for (let field of reportFields) {
      if (searchTerm.query.match(/\b/ + field.name + /\b/)) {
        fieldLists.query.push(field.name);
      } else if (field.type == "keyword") {
        fieldLists.keyword.push(field.name);
        fieldLists.any.push(field.name);
      } else if (field.type == "date") {
        fieldLists.date.push(field.name);
        fieldLists.value.push(field.name);
        fieldLists.any.push(field.name);
      } else {
        fieldLists.number.push(field.name);
        fieldLists.value.push(field.name);
        fieldLists.any.push(field.name);
      }
    }
    let reportDefaults = {};
    Object.keys(reportOptions).forEach((reportName) => {
      let params = reportOptions[reportName];
      reportDefaults[reportName] = {};
      Object.keys(params).forEach((param) => {
        let obj = params[param];
        // if (searchTerm.hasOwnProperty(param)) {
        //   reportDefaults[reportName][param] = searchTerm[param];
        // } else
        let [key, field] = obj.default ? obj.default.split(":") : [];
        if (field) {
          field = new RegExp(field + "\\((.+?)\\)");
        }
        if (searchTerm.hasOwnProperty(key) && !field) {
          reportDefaults[reportName][param] = searchTerm[obj.default];
        } else if (
          searchTerm.hasOwnProperty(key) &&
          field &&
          searchTerm[key].match(field)
        ) {
          let match = searchTerm[key].match(field);
          reportDefaults[reportName][param] = match[1];
          // } else if (obj.fieldType && fieldLists[obj.fieldType].length > 0) {
          //   reportDefaults[reportName][param] = fieldLists[obj.fieldType][0];
          //   Object.values(fieldLists).forEach((list) => {
          //     list = list.filter(
          //       (entry) => entry != reportDefaults[reportName][param]
          //     );
          //   });
        } else if (obj.hasOwnProperty("value")) {
          reportDefaults[reportName][param] = obj.value;
        }
      });
      if (
        reportDefaults[reportName].rank &&
        reportDefaults[reportName].x.match("tax_rank")
      ) {
        reportDefaults[reportName].x = reportDefaults[reportName].x
          .replace(/tax_rank\(\w+\)/, "")
          .replace(/and\s+and/gi, "AND")
          .replace(/\s*and\s*$/i, "");
      }
    });
    return reportDefaults;
  }
);

export const saveReport = ({ options, format = "json" }) => {
  return async function (dispatch) {
    const filename = `report.${format}`;
    options.filename = filename;
    const queryString = sortReportQuery({ options });
    const formats = {
      json: "application/json",
      nwk: "text/x-nh",
      xml: "application/xml",
      zip: "application/zip",
    };
    const queryId = nanoid(10);
    const state = store.getState();
    let url = `${apiUrl}/report?${queryString}&queryId=${queryId}`;
    let status;
    const interval = checkProgress({
      queryId,
      delay: 5000,
      dispatch,
      message: `Preparing ${format.toUpperCase()} file for download`,
    });
    try {
      let response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: formats[format],
        },
        signal: getController(state).signal,
      });
      clearInterval(interval);
      let blob = await response.blob();

      const linkUrl = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = linkUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      clearInterval(interval);
      if (getController(state).signal.aborted) {
        dispatch(
          setMessage({
            message: `Cancelled ${format.toUpperCase()} file download`,
            duration: 5000,
            severity: "warning",
          })
        );
        status = { success: false, error: "Request cancelled" };
      } else {
        dispatch(
          setMessage({
            message: `Failed to prepare ${format.toUpperCase()} file for download`,
            duration: 5000,
            severity: "error",
          })
        );
        status = { success: false, error: "Unexpected error" };
        console.log(error);
      }
      dispatch(resetController());
      return false;
    }
    dispatch(
      setMessage({
        duration: 0,
        severity: "info",
      })
    );
    return true;
  };
};
