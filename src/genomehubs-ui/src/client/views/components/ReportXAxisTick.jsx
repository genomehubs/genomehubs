import React from "react";

export const ReportXAxisTick = (
  props,
  buckets,
  fmt,
  translations,
  pointSize,
  orientation
) => {
  const { x, y, fill, index, width, payload } = props;
  let value = payload.value;
  let yPos = y;
  let offset = 0;
  let bucketWidth = width / (buckets.length - 1);

  if (buckets[index] != payload.value) {
    value = buckets[index] || "";
    offset = bucketWidth / 2;
    // if (index % 2 == 1 && value.length * pointSize * 0.6 > bucketWidth) {
    //   yPos += 12;
    // }
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
  return <g transform={`translate(${x + offset},${yPos})`}>{text}</g>;
};

export default ReportXAxisTick;
