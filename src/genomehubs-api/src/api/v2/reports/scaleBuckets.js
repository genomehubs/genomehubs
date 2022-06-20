import { fmt } from "./fmt";
import { scales } from "./scales";

export const scaleBuckets = (buckets, scaleType = "Linear", bounds) => {
  if (scaleType == "date") {
    buckets = buckets.map((value) => value);
  } else if (scaleType.startsWith("log")) {
    let base = scaleType == "log2" ? 2 : scaleType == "log10" ? 10 : Math.E;
    let interval = buckets[1] - buckets[0];
    let max = buckets[0] + interval * (bounds.tickCount - 1);
    let domain = base ** max - base ** buckets[0];
    let factor = (bounds.domain[1] - bounds.domain[0]) / domain;
    let scale = (v) => base ** v * factor;
    buckets = buckets.map((value) => 1 * fmt(scale(value)));
    if (buckets.length < bounds.tickCount) {
      buckets[bounds.tickCount - 1] = 1 * fmt(scale(max));
    }
  } else {
    let scale = scales[scaleType]()
      .domain(bounds.domain)
      .range([buckets[0], buckets[buckets.length - 1]]);
    buckets = buckets.map(
      (value) => 1 * fmt(scale.invert(value)).replace("−", "-")
    );
  }
  return buckets;
};
