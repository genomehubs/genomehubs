import MultiCatLegend from "./MultiCatLegend";

export const zLegend = ({ props, chartProps }) => {
  let { xAxis, yAxis, fill, name } = props;
  let { width, x } = xAxis;
  let { y } = yAxis;
  let {
    i,
    n,
    catSums,
    pointSize,
    catTranslations = {},
    catOffsets = {},
  } = chartProps;
  let legendWidth = name.length * 10 + 15;
  legendWidth = Math.max(legendWidth, 50);
  let offset, row;
  if (catOffsets[name]) {
    ({ offset, row } = catOffsets[name]);
  }
  if (n == 1) {
    return MultiCatLegend({
      width,
      x,
      y,
      fill,
      i,
      name: catTranslations[name] || name,
      stats: catSums[name],
      legendWidth: Math.max(legendWidth, 100),
      offset,
      row,
      pointSize,
    });
  } else {
    return MultiCatLegend({
      width,
      x,
      y,
      fill,
      i,
      n,
      name: catTranslations[name] || name,
      stats: catSums[name],
      legendWidth: Math.max(legendWidth, 150),
      offset,
      row,
      pointSize,
    });
  }
};

export default zLegend;
