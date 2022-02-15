import { scaleLinear, scaleLog, scaleSqrt } from "d3-scale";

export const scales = {
  linear: scaleLinear,
  log: scaleLog,
  log10: scaleLog,
  log2: () => scaleLog().base(2),
  sqrt: scaleSqrt,
};
