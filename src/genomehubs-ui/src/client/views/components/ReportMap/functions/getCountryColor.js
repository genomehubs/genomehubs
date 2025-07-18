import { mixColor } from "../../../functions/mixColor";

export default function getCountryColor(
  count,
  maxCount,
  baseColor = "#ff7001",
  baseBg = "#eeeeee",
) {
  if (!count) {
    return baseBg;
  }
  const ratio = count / maxCount;
  return mixColor({ color1: baseColor, color2: baseBg, ratio });
}
