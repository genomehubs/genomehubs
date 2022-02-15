import { precision } from "./precision";

const incrementFloat = (val) => {
  let prec = precision(val);
  val += 10 ** -prec;
  return val;
};
