import { apiUrl, setApiStatus } from "../reducers/api";
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
} from "../reducers/search";

import { byIdSelectorCreator } from "../reducers/selectorCreators";
import { checkProgress } from "./checkProgress";
import { createCachedSelector } from "re-reselect";
import { createSelector } from "reselect";
// import { format } from "d3-format";
import { getTypes } from "../reducers/types";
import { nanoid } from "nanoid";
import { processTree } from "./tree";
import qs from "qs";
import store from "../store";
import { treeThreshold } from "../reducers/tree";

export const sortReportQuery = ({ queryString, options, ui = true }) => {
  const reportTerms = {
    result: true,
    report: true,
    query: { not: new Set(["sources"]), as: "x" },
    x: { not: new Set(["sources"]) },
    y: { in: new Set(["scatter", "tree", "xInY"]) },
    z: { in: new Set(["scatter"]) },
    cat: { not: new Set(["sources", "xInY"]) },
    rank: { not: new Set(["sources", "tree"]) },
    ranks: { in: new Set(["tree"]) },
    levels: { in: new Set(["tree"]), ui: true },
    names: { in: new Set(["tree"]) },
    fields: { in: new Set(["tree"]) },
    collapseMonotypic: { in: new Set(["tree"]) },
    includeEstimates: true,
    excludeAncestral: true,
    excludeDescendant: true,
    excludeMissing: true,
    excludeDirect: true,
    taxonomy: true,
    caption: true,
    xOpts: { in: new Set(["histogram", "scatter"]) },
    yOpts: { in: new Set(["scatter", "tree"]) },
    highlightArea: { in: new Set(["scatter"]), ui: true },
    scatterThreshold: { in: new Set(["scatter"]) },
    treeStyle: { in: new Set(["tree"]), ui: true },
    yScale: { in: new Set(["histogram"]), ui: true },
    zScale: { in: new Set(["scatter"]), ui: true },
    stacked: { in: new Set(["histogram"]), ui: true },
    cumulative: { in: new Set(["histogram"]), ui: true },
    treeThreshold: { in: new Set(["tree"]) },
    queryId: { in: new Set(["histogram", "scatter", "tree", "xInY"]) },
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

export function fetchReport({ reportId, reload, report, hideMessage }) {
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
        delay: 1000,
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
      }
    } catch (err) {
      return dispatch(setApiStatus(false));
    }
  };
}

const processScatter = (scatter) => {
  if (!scatter) {
    return {};
  }
  let chartData = [];
  let heatmaps = scatter.histograms;
  if (!heatmaps) {
    return {};
  }
  let valueType = heatmaps.valueType;
  let cats;
  let lastIndex = heatmaps.buckets.length - 2;
  let h = heatmaps.yBuckets[1] - heatmaps.yBuckets[0];
  let w = heatmaps.buckets[1] - heatmaps.buckets[0];
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
    scatter.cats.forEach((cat) => {
      catSums[cat.label] = 0;
      let catData = [];
      heatmaps.buckets.forEach((bucket, i) => {
        if (i < heatmaps.buckets.length - 1) {
          heatmaps.yBuckets.forEach((yBucket, j) => {
            if (
              j < heatmaps.yBuckets.length - 1 &&
              heatmaps.yValuesByCat[cat.key] &&
              heatmaps.yValuesByCat[cat.key][i]
            ) {
              let z = heatmaps.yValuesByCat[cat.key][i][j];
              if (z > 0) {
                catData.push({
                  h,
                  w,
                  x: bucket,
                  y: yBucket,
                  xBound: heatmaps.buckets[i + 1],
                  yBound: heatmaps.yBuckets[j + 1],
                  z,
                  count: heatmaps.allYValues[i][j],
                });
                catSums[cat.label] += z;
              }
            }
          });
        }
      });
      chartData.push(catData);
      if (
        hasRawData &&
        pointData &&
        heatmaps &&
        heatmaps.rawData &&
        heatmaps.rawData[cat.key]
      ) {
        pointData.push(heatmaps.rawData[cat.key]);
        for (let obj of heatmaps.rawData[cat.key]) {
          locations[obj.scientific_name.toLowerCase()] = { x: obj.x, y: obj.y };
        }
      }
    });
  } else {
    cats = ["all taxa"];
    let catData = [];
    heatmaps.buckets.forEach((bucket, i) => {
      if (i < heatmaps.buckets.length - 1) {
        heatmaps.yBuckets.forEach((yBucket, j) => {
          if (j < heatmaps.yBuckets.length - 1) {
            let z = heatmaps.allYValues[i][j];
            if (z > 0) {
              catData.push({
                h,
                w,
                x: bucket,
                y: yBucket,
                xBound: heatmaps.buckets[i + 1],
                yBound: heatmaps.yBuckets[j + 1],
                z,
                count: z,
              });
            }
          }
        });
      }
    });
    chartData.push(catData);
    if (hasRawData) {
      pointData.push(heatmaps.rawData);
      for (let obj of heatmaps.rawData) {
        locations[obj.scientific_name.toLowerCase()] = { x: obj.x, y: obj.y };
      }
    }
  }
  return { chartData, pointData, cats, catSums, locations };
};

const processReport = (report) => {
  if (!report || !report.name) return {};
  if (report.name == "tree") {
    let { treeStyle } = qs.parse(report.report.queryString);
    let { tree, xQuery, yQuery, bounds, yBounds } = report.report.tree;
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
          }),
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
          ...processScatter(report.report.scatter),
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
  (_state, reportId) => reportId,
  (report, reportId) => {
    return processReport(report, reportId);
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
  xInY: {
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
      delay: 1000,
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
