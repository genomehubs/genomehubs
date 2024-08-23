import { attrTypes } from "../functions/attrTypes.js";
import { scaleTime } from "d3-scale";

export const scaleFuncs = {
  log2: (value) => Math.log2(value),
  log10: (value) => Math.log10(value),
  log: (value) => Math.log(value),
  sqrt: (value) => Math.sqrt(value),
  linear: (value) => value,
  ordinal: (value) => value,
  log2Inv: (value) => Math.pow(2, value),
  log10Inv: (value) => Math.pow(10, value),
  logInv: (value) => Math.pow(Math.E, value),
  sqrtInv: (value) => value * value,
  linearInv: (value) => value,
  ordinalInv: (value) => value,
};

export const histogramAgg = async ({
  field,
  summary,
  result,
  rawValues,
  bounds,
  yHistograms,
  taxonomy,
}) => {
  const scales = {
    log2: "Math.max(Math.log(_value)/Math.log(2), 0)",
    log10: "Math.log10(_value)",
    log: "Math.log(_value)",
    sqrt: "Math.sqrt(_value)",
  };

  const day = 86400000;
  const duration = (interval) => {
    if (interval < day * 0.75) {
      return "1h";
    } else if (interval < 21 * day) {
      return "1d";
    } else if (interval < 90 * day) {
      return "1w";
    } else if (interval < 366 * day) {
      return "1M";
    } else if (interval < 1000 * day) {
      return "1q";
    }
    return "1y";
  };

  const dateSummary = {
    min: "from",
    max: "to",
  };

  const timeLimits = (startTime, endTime) => {
    let ticks = scaleTime().domain([startTime, endTime]).nice().ticks();
    return [ticks[0], ticks[ticks.length - 1]];
  };

  let { lookupTypes } = await attrTypes({ result, taxonomy });
  let meta = lookupTypes(field);
  if (!meta) {
    return;
  }

  let scale, min, max, count, offset;
  let interval, calendar_interval, histKey;

  if (meta.type == "date") {
    histKey = "date_histogram";
    [min, max] = timeLimits(bounds.stats.min, bounds.stats.max);
    min = bounds.domain[0];
    max = bounds.domain[1];
    if (typeof min === "string") {
      min = new Date(min).getTime();
    }
    if (typeof max === "string") {
      max = new Date(max).getTime();
    }
    max = Math.max(max, min + day);
    calendar_interval = duration(max - min);
  } else {
    histKey = "histogram";
    ({
      scale = "linear",
      min = bounds.stats.min,
      max = bounds.stats.max,
      // count = bounds.tickCount,
    } = meta.bins || {});
    if (bounds) {
      if (bounds.domain && !isNaN(bounds.domain[0])) {
        scale = bounds.scale;
        min = scaleFuncs[scale](bounds.domain[0]);
        if (min == -Infinity) {
          min = 0;
        }
      }
      if (bounds.domain && !isNaN(bounds.domain[1])) {
        max = scaleFuncs[scale](1 * bounds.domain[1]);
      }
      count = bounds.tickCount - 1;
    }
    if (count) {
      if (scale.startsWith("log")) {
        interval = (max - min) / count;
        // max += interval;
      } else {
        interval = (max - min) / count;
      }
    }
    offset = min;
  }
  let fieldKey = `attributes${rawValues ? ".values" : ""}.`;
  if (!summary || summary == "value") {
    fieldKey += `${meta.type}_value`;
  } else if (meta.type == "date") {
    fieldKey += dateSummary[summary] || `${meta.type}_value`;
  } else {
    fieldKey += summary;
  }
  return {
    [histKey]: {
      field: fieldKey,
      ...(scales[scale] && { script: scales[scale] }),
      ...(interval && { interval }),
      ...(calendar_interval && { calendar_interval }),
      extended_bounds: {
        min,
        max,
      },
      offset,
    },
    aggs: {
      yHistograms,
    },
  };
};
