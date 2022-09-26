import { apiUrl, setApiStatus } from "../reducers/api";
import { directColor, getDefaultPalette } from "../reducers/color";
import {
  getSummaries,
  getSummariesFetching,
  receiveSummary,
  requestSummary,
} from "../reducers/explore";
import { scaleLinear, scaleLog, scaleSqrt } from "d3-scale";

import { createCachedSelector } from "re-reselect";
import { createSelector } from "reselect";
import { format } from "d3-format";
import { formatter } from "../functions/formatter";
import { interpolateGreens } from "d3-scale-chromatic";
import store from "../store";

export function fetchSummary(lineage, field, summary, taxonomy, result) {
  return async function (dispatch) {
    const state = store.getState();
    const fetching = getSummariesFetching(state);
    const summaries = getSummaries(state);
    let id = `${lineage}--${field}--${summary}--${taxonomy}`;
    if (summaries[id] || fetching[id]) {
      return;
    }
    dispatch(requestSummary(`${lineage}--${field}--${summary}--${taxonomy}`));
    let url = `${apiUrl}/summary?recordId=${lineage}&result=${result}&taxonomy=${taxonomy}&summary=${summary}&fields=${field}`;
    try {
      let json;
      try {
        const response = await fetch(url);
        json = await response.json();
      } catch (error) {
        json = console.log("An error occured.", error);
      }
      dispatch(receiveSummary(json));
    } catch (err) {
      return dispatch(setApiStatus(false));
    }
  };
}
const scales = {
  log2: () => scaleLog().base(2),
  log10: scaleLog,
  sqrt: scaleSqrt,
  linear: scaleLinear,
};
const processHistogram = (summary) => {
  const state = store.getState();
  const palette = getDefaultPalette(state);
  let buckets = [];
  let ticks = [];
  const binMeta = summary.meta.bins;
  let xBinScale = scales[binMeta.scale]();
  let xBinDomain, xDomain;
  if (binMeta.scale == "log2") {
    xDomain = [2 ** binMeta.min, 2 ** binMeta.max];
    xBinDomain = [binMeta.min, binMeta.max];
    xBinScale.domain(xBinDomain);
  } else {
    xDomain = [xBinScale.invert(binMeta.min), xBinScale.invert(binMeta.max)];
    xBinDomain = xDomain.map((x) => xBinScale(x));
  }
  const xRange = [0, 1000];
  const xScale = scaleLinear().domain(xBinDomain).range(xRange);
  xBinScale = xBinScale.domain(xDomain).range(xBinDomain).invert;
  const binCount = binMeta.count;
  const width = (xRange[1] - xRange[0]) / binCount;
  let underCount = 0;
  let overCount = 0;
  let max = 0;
  summary.summary.buckets.forEach((bucket, i) => {
    let bin = bucket.key;
    let count = 0;
    const x = xScale(bin);
    if (bin < xBinDomain[0]) {
      underCount += bucket.doc_count;
    } else if (bin >= xBinDomain[1]) {
      overCount += bucket.doc_count;
      if (bin == xBinDomain[1]) {
        let tick = { x, value: formatter(xBinScale(bin)) };
        ticks.push(tick);
      }
    } else {
      count = bucket.doc_count;
      let tick = { x, value: formatter(xBinScale(bin)) };
      if (bin == xBinDomain[0]) {
        count += underCount;
      }
      ticks.push(tick);
      buckets.push({
        bin,
        count,
        x,
        width,
        ...(bin > xBinDomain[0] && {
          min: format(",.3~r")(xBinScale(bin)).replaceAll(",", ""),
        }),
        ...(bin < xBinDomain[1] - 0.3 && {
          max: format(",.3~r")(
            xBinScale(summary.summary.buckets[i + 1].key)
          ).replaceAll(",", ""),
        }),
      });
      max = Math.max(max, count);
    }
  });
  if (overCount) {
    buckets[buckets.length - 1].count += overCount;
    max = Math.max(max, buckets[buckets.length - 1].count);
  }
  let lin = scaleLinear().domain([1, max]).range([0.25, 1]);
  let seq = interpolateGreens;
  buckets.forEach((bucket) => {
    if (bucket.count) {
      bucket.color = palette.levels[1][0];
      bucket.opacity = lin(bucket.count);
    } else {
      bucket.color = "none";
    }
  });
  return { buckets, ticks, max };
};
const processTerms = (summary) => {
  let max = 0;
  let buckets = summary.summary.buckets.map((obj) => {
    max = Math.max(max, obj.doc_count);
    return {
      value: obj.key,
      count: obj.doc_count,
    };
  });
  let lin = scaleLinear().domain([1, max]).range([0.25, 1]);
  let seq = interpolateGreens;
  buckets.forEach((bucket) => {
    if (bucket.count) {
      bucket.color = seq(lin(bucket.count));
    } else {
      bucket.color = "none";
    }
  });
  return { buckets };
};
const processSummary = (summaries, summaryId) => {
  let summary = summaries[summaryId];
  if (!summary) return {};
  if (summary.name == "histogram") {
    return processHistogram(summary);
  }
  if (summary.name == "terms") {
    return processTerms(summary);
  }
  return summary;
};

export const getSummaryBySummaryId = createCachedSelector(
  getSummaries,
  (_state, summaryId) => summaryId,
  (summaries, summaryId) => processSummary(summaries, summaryId)
)((_state, summaryId) => summaryId);

export const getHistograms = createSelector(getSummaries, (summaries) => {
  let histograms = {};
  summaries.allIds.forEach((id) => {
    let parts = id.split("--");
    if (parts[2] == "histogram") {
      if (!histograms[parts[0]]) {
        histograms[parts[0]] = {};
      }
      histograms[parts[0]][parts[1]] = summaries.byId[id];
    }
  });
  return histograms;
});
