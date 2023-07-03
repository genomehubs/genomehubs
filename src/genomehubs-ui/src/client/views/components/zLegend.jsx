import MultiCatLegend from "./MultiCatLegend";

export const zLegend = ({ props, chartProps, handleClick }) => {
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
    compactLegend,
    currentSeries = false,
  } = chartProps;
  let active = currentSeries !== false && currentSeries == i;
  let legendWidth = (name?.length || 1) * 9 + 10;
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
      compactLegend,
      handleClick,
      active,
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
      legendWidth: Math.max(legendWidth, pointSize * 10),
      offset,
      row,
      pointSize,
      compactLegend,
      handleClick,
      active,
    });
  }
};

export default zLegend;
