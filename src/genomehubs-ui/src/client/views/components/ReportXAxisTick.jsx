import React from "react";
import { Rectangle } from "recharts";
import Tooltip from "./Tooltip";
import { active as activeStyle } from "./Styles.scss";
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
  showLabels,
  marginTop,
}) => {
  let { x, y, fill, index, width, payload } = props;
  let { value } = payload;
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
  if (Number.isNaN(x) && lastPos) {
    if (valueType == "lineage") {
      return;
    }
    x = lastPos;
    if (report == "histogram" && valueType != "lineage") {
      x += bucketWidth / 2;
    }
  }
  let tickOffset = 0;
  if (report == "histogram") {
    if (valueType != "lineage" && valueType != "keyword") {
      tickOffset = 0;
    } else {
      tickOffset = -bucketWidth / 2;
    }
    offset -= bucketWidth / 2;
    tickLine = (
      <line
        x1={tickOffset}
        x2={tickOffset}
        y1={-8}
        y2={-3}
        fill={"none"}
        stroke={fill}
      />
    );
    if (lastPos) {
      tickLine = (
        <>
          {tickLine}
          <line
            x1={tickOffset}
            x2={tickOffset}
            y1={-8}
            y2={-3}
            fill={"none"}
            stroke={fill}
          />
        </>
      );
    }
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
  let centered;
  let ttValue;
  if (
    (labels && labels[index] != payload.value) ||
    (valueType == "lineage" && payload.value == "other")
  ) {
    value = labels[index] || "";
    offset += bucketWidth / 2;
    //centered = true;
    ttValue = value;
  } else if (buckets[index] != payload.value || valueType == "keyword") {
    value = buckets[index] || "";
    offset += bucketWidth / 2;
    centered = true;
    ttValue = value;
  } else {
    if (index < buckets.length - 1) {
      ttValue = `${fmt(buckets[index])}-${fmt(buckets[index + 1])}`;
    }
    value = fmt(value);
    if (!orientation) {
      if (!value) {
        return null;
      }
      if (index % 2 == 1 && value.length * pointSize * 0.6 > bucketWidth) {
        return null;
      }
      if (index % 4 != 0 && value.length * pointSize * 0.6 > bucketWidth * 2) {
        return null;
      }
    }
  }
  let text;
  let rect;
  let textValue = translations[value] || value;
  ttValue = translations[ttValue] || ttValue;
  if (showLabels) {
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
          {textValue}
        </text>
      );
    } else {
      text = (
        <text
          x={0}
          y={0}
          dy={5}
          textAnchor="end"
          dominantBaseline={"alphabetic"}
          alignmentBaseline={"middle"}
          fill={fill}
          fontSize={pointSize}
          transform={`rotate(${orientation})`}
        >
          {textValue}
        </text>
      );
    }
  } else if (ttValue) {
    rect = (
      <g>
        <Tooltip title={ttValue} arrow placement="top">
          <Rectangle
            className={activeStyle}
            x={centered ? 0 - bucketWidth / 2 : 0}
            y={marginTop - yPos}
            height={yPos + pointSize - marginTop}
            width={bucketWidth}
            stroke={"none"}
            fill={"rgb(200,200,200)"}
            fillOpacity={0}
          />
        </Tooltip>
        <Rectangle
          x={centered ? 0 - bucketWidth / 2 : 0}
          y={marginTop - yPos}
          height={yPos - 10 - marginTop}
          width={bucketWidth}
          stroke={"none"}
          fill={"rgb(255,255,255)"}
          fillOpacity={0}
        />
      </g>
    );
  }
  return (
    <g transform={`translate(${x + offset},${yPos})`}>
      {text}
      {tickLine}
      {rect}
    </g>
  );
};

export default ReportXAxisTick;
