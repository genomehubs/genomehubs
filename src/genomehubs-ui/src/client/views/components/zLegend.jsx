import MultiCatLegend from "./MultiCatLegend";

export const zLegend = ({ props, chartProps }) => {
  let { xAxis, yAxis, fill, name } = props;
  let { width, x } = xAxis;
  let { y } = yAxis;
  let { i, n, catSums } = chartProps;
  if (n == 1) {
    // return singleCatLegend({ range, domain, scale, width, x, y, fill });
    return MultiCatLegend({ width, x, y, fill, i, name, stats: catSums[name] });
  } else {
    return MultiCatLegend({
      width,
      x,
      y,
      fill,
      i,
      n,
      name,
      stats: catSums[name],
    });
  }
};

export default zLegend;
