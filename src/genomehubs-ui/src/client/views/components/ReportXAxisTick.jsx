import React from "react";
import { scaleLinear } from "d3-scale";

export const ReportXAxisTick = ({
  props,
  buckets,
  fmt,
  translations,
  pointSize,
  orientation,
  lastPos,
  report,
  labels,
  valueType,
  bounds,
  maxLabel,
}) => {
  let { x, y, fill, index, width, payload } = props;
  let value = payload.value;
  let yPos = y;
  let offset = 0;
  let bucketWidth;
  if (valueType == "coordinate") {
    let xScale = scaleLinear().domain(bounds.domain).range([0, width]);
    bucketWidth = xScale(buckets[index + 1]) - xScale(buckets[index]);
  } else {
    bucketWidth = width / (buckets.length - 1);
  }
  let tickLine;
  if (isNaN(x) && lastPos) {
    x = lastPos;
    if (report == "histogram") {
      x += bucketWidth / 2;
    }
  }
  if (report == "histogram") {
    offset -= bucketWidth / 2;
    tickLine = (
      <line x1={0} x2={0} y1={-8} y2={-3} fill={"none"} stroke={fill} />
    );
  }
  if (report == "catHistogram" && index < buckets.length - 2) {
    tickLine = (
      <line
        x1={bucketWidth / 2}
        x2={bucketWidth / 2}
        y1={-8}
        y2={-3}
        fill={"none"}
        stroke={fill}
      />
    );
  }
  if (labels && labels[index] != payload.value) {
    value = labels[index] || "";
    offset += bucketWidth / 2;
  } else if (buckets[index] != payload.value) {
    value = buckets[index] || "";
    offset += bucketWidth / 2;
  } else {
    value = fmt(value);
    if (!orientation) {
      if (index % 2 == 1 && value.length * pointSize * 0.6 > bucketWidth) {
        return null;
      }
      if (index % 4 != 0 && value.length * pointSize * 0.6 > bucketWidth * 2) {
        return null;
      }
    }
  }
  let text;
  if (orientation == 0) {
    text = (
      <text
        x={0}
        y={0}
        dy={5}
        textAnchor="middle"
        dominantBaseline={"hanging"}
        fill={fill}
        fontSize={pointSize}
      >
        {translations[value] || value}
      </text>
    );
  } else {
    text = (
      <text
        x={0}
        y={0}
        dy={5}
        textAnchor="end"
        dominantBaseline={"middle"}
        alignmentBaseline={"alphabetic"}
        fill={fill}
        fontSize={pointSize}
        transform={`rotate(${orientation})`}
      >
        {translations[value] || value}
      </text>
    );
  }
  return (
    <g transform={`translate(${x + offset},${yPos})`}>
      {text}
      {tickLine}
    </g>
  );
};

export default ReportXAxisTick;
