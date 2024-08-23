import { precision } from "./precision.js";

const incrementFloat = (val) => {
  let prec = precision(val);
  val += 10 ** -prec;
  return val;
};
