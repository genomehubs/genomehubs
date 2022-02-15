import { scaleLinear, scaleLog, scaleSqrt } from "d3-scale";

export const axisScales = {
  linear: scaleLinear,
  log10: scaleLog,
  log2: () => scaleLog().base(2),
  log: scaleLog,
  sqrt: scaleSqrt,
  proportion: scaleLinear,
};

export default axisScales;
