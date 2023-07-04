// import { RadialChart } from "react-vis";
import {
  CartesianGrid,
  Curve,
  Dot,
  Label,
  Rectangle,
  Scatter,
  ScatterChart,
  Text,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import React, { useEffect, useRef, useState } from "react";
import formats, { setInterval } from "../functions/formats";
import stringLength, { maxStringLength } from "../functions/stringLength";
import { useLocation, useNavigate } from "@reach/router";

import CellInfo from "./CellInfo";
import Grid from "@material-ui/core/Grid";
import PointInfo from "./PointInfo";
import ReportXAxisTick from "./ReportXAxisTick";
import Tooltip from "@material-ui/core/Tooltip";
import axisScales from "../functions/axisScales";
import { compose } from "recompose";
import { line as d3Line } from "d3-shape";
import dispatchMessage from "../hocs/dispatchMessage";
import { format } from "d3-format";
import hexToHSL from "hex-to-hsl";
import { processLegendData } from "./MultiCatLegend";
// import { point } from "leaflet";
import qs from "../functions/qs";
import { scaleLinear } from "d3-scale";
import styles from "./Styles.scss";
import useResize from "../hooks/useResize";
import withColors from "../hocs/withColors";
import withReportTerm from "../hocs/withReportTerm";
import withSiteName from "../hocs/withSiteName";
import { zLegend } from "./zLegend";

const searchByCell = ({
  xQuery,
  yQuery,
  report,
  xLabel,
  yLabel,
  xRange,
  yRange,
  bounds,
  yBounds,
  navigate,
  location,
  fields,
  ranks,
  valueType,
  yValueType,
  summary,
  ySummary,
  basename,
}) => {
  let query = xQuery.query;
  let field = bounds.field;
  query = query
    .replaceAll(new RegExp("AND\\s+" + bounds.field + "\\s+AND", "gi"), "AND")
    .replaceAll(
      new RegExp("AND\\s+" + bounds.field + "\\s+>=\\s*[\\w\\d_\\.-]+", "gi"),
      ""
    )
    .replaceAll(
      new RegExp("AND\\s+" + bounds.field + "\\s+<\\s*[\\w\\d_\\.-]+", "gi"),
      ""
    );
  if (summary && summary != "value") {
    field = `${summary}(${field})`;
    query = query
      .replaceAll(new RegExp("AND\\s+" + field + "\\s+AND", "gi"), "AND")
      .replaceAll(
        new RegExp("AND\\s+" + field + "\\s+>=\\s*[\\w\\d_\\.-]+", "gi"),
        ""
      )
      .replaceAll(
        new RegExp("AND\\s+" + field + "\\s+<\\s*[\\w\\d_\\.-]+", "gi"),
        ""
      );
  }
  query = query.replaceAll(/\s+/g, " ").replace(/\s+$/, "");
  if (valueType == "coordinate") {
    query += ` AND sequence_id = ${xRange},${yRange}`;
    query = query.replace("collate(assembly_id,", "collate(sequence_id,");
  } else if (valueType == "date") {
    query += ` AND ${field} >= ${
      new Date(xRange[0]).toISOString().split(/t/i)[0]
    } AND ${field} < ${new Date(xRange[1]).toISOString().split(/t/i)[0]}`;
  } else if (valueType == "keyword" && field == bounds.field) {
    let val = bounds.stats.cats[xRange[0]].key;
    if (val == "other") {
      let list = [];
      for (let obj of bounds.stats.cats) {
        if (obj.key != "other") {
          list.push(obj.key);
        }
      }
      query += ` AND ${field} != ${list.join(",")}`;
    } else {
      query += ` AND ${field} = ${val}`;
    }
  } else {
    query += ` AND ${field} >= ${xRange[0]} AND ${field} < ${xRange[1]}`;
  }
  let yField = yBounds.field;
  if (ySummary && ySummary != "value") {
    yField = `${ySummary}(${yField})`;
  }
  if (yValueType == "date") {
    query += ` AND ${yField} >= ${
      new Date(yRange[0]).toISOString().split(/t/i)[0]
    } AND ${yField} < ${new Date(yRange[1]).toISOString().split(/t/i)[0]}`;
  } else if (yValueType == "keyword" && yField == yBounds.field) {
    let val = yBounds.stats.cats[yRange[0]].key;
    if (val == "other") {
      let list = [];
      for (let obj of yBounds.stats.cats) {
        if (obj.key != "other") {
          list.push(obj.key);
        }
      }
      query += ` AND ${yField} != ${list.join(",")}`;
    } else {
      query += ` AND ${yField} = ${val}`;
    }
  } else if (yValueType != "coordinate") {
    query += ` AND ${yField} >= ${yRange[0]} AND ${yField} < ${yRange[1]}`;
  }

  // let fields = `${xLabel},${yLabel}`;
  let { xOpts, yOpts, highlightArea, ...options } = qs.parse(
    location.search.replace(/^\?/, "")
  );
  if (options.sortBy && !fields.includes(options.sortBy)) {
    delete options.sortBy;
    delete options.sortOrder;
  }
  options.offset = 0;
  if (fields) {
    fields = fields.join(",");
  }
  if (ranks) {
    ranks = ranks.join(",");
  } else {
    ranks = "";
  }
  for (let key of [
    "excludeAncestral",
    "excludeDescendant",
    "excludeDirect",
    "excludeMissing",
  ]) {
    if (xQuery[key]) {
      delete xQuery[key];
    }
  }
  let queryString = qs.stringify({
    ...xQuery,
    ...options,
    query,
    ...(yQuery && { y: yQuery.query }),
    fields,
    report,
    ranks,
  });

  // let hash = encodeURIComponent(query);
  navigate(
    `${basename}/search?${queryString.replace(/^\?/, "")}#${encodeURIComponent(
      query
    )}`
  );
};

const searchByPoint = ({ props, chartProps }) => {
  let { xQuery, fields, ranks, groupBy, navigate, basename, bounds, yBounds } =
    chartProps;
  let { group, featureId, yFeatureId, payload, cat } = props;
  let { x, y } = payload;
  let { result, taxonomy } = xQuery;
  let pointQuery;
  if (featureId) {
    pointQuery = `feature_id=${featureId},${yFeatureId} AND ${groupBy}=${group}`;
  } else {
    pointQuery = `${bounds.field}=${x} AND ${yBounds.field}=${y}`;
  }
  let queryString = qs.stringify({
    query: pointQuery,
    fields: fields.join(","),
    ranks: ranks || "",
    taxonomy,
    result,
  });

  // let hash = encodeURIComponent(query);
  navigate(
    `${basename}/search?${queryString.replace(/^\?/, "")}#${encodeURIComponent(
      pointQuery
    )}`
  );
};

const CustomDot = (props, chartProps) => {
  let { cx, cy, height: r, fill } = props;
  let { pointRatio } = chartProps;

  return (
    <Dot
      cx={cx}
      cy={cy}
      r={r * pointRatio}
      stroke={fill}
      fill={"none"}
      strokeWidth={(r * pointRatio) / 2}
    />
  );
};

const CustomCircle = (props, chartProps) => {
  let { cx, cy, height: r, fill } = props;
  let { pointSize, pointRatio, selectMode, active } = chartProps;
  let dot = (
    <Dot
      cx={cx}
      cy={cy}
      r={(pointSize * pointRatio) / 2}
      stroke={active ? "rgb(102,102,102)" : "none"}
      fill={fill}
      style={{
        cursor: active && selectMode == "point" ? "pointer" : "default",
      }}
      // strokeWidth={r / 2}
    />
  );
  if (active && selectMode == "point") {
    dot = (
      <>
        <Tooltip title={<PointInfo {...{ ...props, chartProps }} />} arrow>
          <g onClick={() => searchByPoint({ props, chartProps })}>{dot}</g>
        </Tooltip>
      </>
    );
  }
  return dot;
};

const drawHeatRect = ({ props, chartProps, h, w }) => {
  let { z, offset } = props.payload;
  let scale = axisScales[chartProps.zScale]();
  let domain = [1, chartProps.zDomain[1]];
  scale.domain(domain).range([2, w]);
  if (chartProps.n == 1) {
    scale.range([0.1, 1]);
  } else if (chartProps.zScale == "proportion") {
    scale.domain([0, 1]).range([0, w]);
    z /= chartProps.catSums[props.name].sum;
    offset /= chartProps.catSums[props.name].sum;
  }
  let width = w;
  let height = h;
  let x = props.cx;
  let y = props.cy - h;
  let opacity = 1;
  if (chartProps.n == 1) {
    opacity = scale(z);
  } else if (chartProps.stacked) {
    scale.range([scale.domain()[0], h]);
    height = scale(z + offset) - scale(offset);
    y += h - height - scale(offset);
  } else {
    width = scale(z);
    height /= chartProps.n;
    y += height * chartProps.i;
  }
  return (
    <Rectangle
      {...props}
      height={height}
      width={width}
      // mask={`url(#mask-stripe-${chartProps.n}-${chartProps.i})`}
      fill={props.fill}
      x={x} // {props.cx + (w - width) / 2}
      y={y}
      // fillOpacity={chartProps.n > 1 ? 1 : props.zAxis.scale(props.payload.z)}
      fillOpacity={chartProps.n > 1 ? 1 : scale(props.payload.z)}
      style={{ pointerEvents: "none" }}
    />
  );
};

const CustomShape = (props, chartProps, handleClick) => {
  let w, h;
  let heatRect, legendGroup;
  let xRange, yRange, xSearchRange, ySearchRange, yIndex;
  if (chartProps.valueType == "coordinate") {
    let xScale = scaleLinear()
      .domain(chartProps.bounds.domain)
      .range([0, props.xAxis.width]);
    let xIndex = chartProps.buckets.indexOf(props.payload.x);
    w =
      xScale(chartProps.buckets[xIndex + 1]) -
      xScale(chartProps.buckets[xIndex]);
    xRange = chartProps.labels[xIndex];
    xSearchRange = xRange;
    let yScale = scaleLinear()
      .domain(chartProps.yBounds.domain)
      .range([0, props.yAxis.height]);
    yIndex = chartProps.yBuckets.indexOf(props.payload.y);
    h =
      yScale(chartProps.yBuckets[yIndex + 1]) -
      yScale(chartProps.yBuckets[yIndex]);
  } else {
    h = props.yAxis.height / chartProps.yLength;
    if (chartProps.yValueType == "date") {
      h =
        props.yAxis.scale(props.payload.y) -
        props.yAxis.scale(props.payload.yBound);
    }
    w = props.xAxis.width / chartProps.xLength;
    if (chartProps.valueType == "date") {
      w =
        props.xAxis.scale(props.payload.xBound) -
        props.xAxis.scale(props.payload.x);
    }
    xSearchRange = [props.payload.x, props.payload.xBound];
    if (chartProps.bounds.scale == "ordinal") {
      try {
        xRange = `${chartProps.bounds.stats.cats[props.payload.x].key}`;
      } catch {
        xRange = "other";
      }
    } else {
      xRange = `${chartProps.xFormat(props.payload.x)}-${chartProps.xFormat(
        props.payload.xBound
      )}`;
    }
  }
  if (chartProps.yValueType == "coordinate") {
    yRange = chartProps.yLabels[yIndex];
    ySearchRange = yRange;
  } else {
    ySearchRange = [props.payload.y, props.payload.yBound];
    if (chartProps.yBounds.scale == "ordinal") {
      try {
        yRange = `${chartProps.yBounds.stats.cats[props.payload.y].key}`;
      } catch {
        yRange = "other";
      }
    } else {
      yRange = `${chartProps.yFormat(props.payload.y)}-${chartProps.yFormat(
        props.payload.yBound
      )}`;
    }
  }
  let bgRect;

  if (!chartProps.hasRawData) {
    heatRect = drawHeatRect({ props, chartProps, h, w });
  }
  if ((heatRect || chartProps.selectMode == "bin") && chartProps.active) {
    bgRect = (
      <>
        <Tooltip
          title={<CellInfo x={xRange} y={yRange} count={props.payload.count} />}
          arrow
        >
          <Rectangle
            className={styles.active}
            height={h}
            width={w}
            x={props.cx}
            y={props.cy - h}
            style={chartProps.embedded ? {} : { cursor: "pointer" }}
            fill={`rgba(125,125,125)`}
            fillOpacity={0}
            onClick={
              chartProps.embedded || !chartProps.active
                ? () => {}
                : () =>
                    searchByCell({
                      ...chartProps,
                      xRange: xSearchRange,
                      yRange: ySearchRange,
                    })
            }
          />
        </Tooltip>
      </>
    );
  }
  if (props.key == "symbol-0") {
    legendGroup = zLegend({
      props,
      chartProps,
      handleClick,
    });
  }

  return (
    <>
      {bgRect}
      {heatRect}
      {legendGroup}
      {/* {legendGroupOrig} */}
    </>
  );
};

const eqnToLine = (eqn, { x: xMin, y: yMin, xBound, yBound, xAxis, yAxis }) => {
  let points = [];
  let xScale = scaleLinear().domain([0, 100]).range([xMin, xBound]);
  let m = eqn[1] == "" ? 1 : isNaN(eqn[1]) ? 1 : eqn[1] * 1;
  let pow = 1;
  let c = 0;
  if (eqn[2].match(/(\*\*|\^)/)) {
    pow = eqn[3] * 1;
  }
  c = eqn[4] == "" ? 0 : isNaN(eqn[4]) ? 0 : eqn[4] * 1;
  for (let i = 0; i <= 100; i++) {
    let x = xScale(i);
    let y = m * x ** pow + c;
    if (y >= yMin && y <= yBound) {
      points.push([xAxis.scale(x), yAxis.scale(y)]);
    }
  }
  let line = d3Line().context(null);
  return line(points);
};

const HighlightShape = (props, chartProps) => {
  let { cx, cy, xAxis, yAxis } = props;
  let { x, y, xBound, yBound, label } = props.payload;
  let { eqn } = chartProps;
  let height = yAxis.scale(yBound) - cy;
  let width = xAxis.scale(xBound) - cx;
  let text, rect, path;
  let color = "black";
  if (label) {
    text = (
      <Text
        x={cx + width - 4}
        y={cy - 6}
        fill={color}
        textAnchor={"end"}
        fontSize={chartProps.pointSize}
      >
        {label}
      </Text>
    );
  }
  if (eqn) {
    let d = eqnToLine(eqn, {
      x: x,
      y: y,
      xBound: xBound,
      yBound: yBound,
      xAxis,
      yAxis,
    });
    path = (
      <path
        d={d}
        fill={"none"}
        stroke={color}
        strokeWidth={chartProps.pointSize / 10}
        strokeDasharray={chartProps.pointSize}
        strokeOpacity={0.5}
      />
    );
  } else {
    rect = (
      <Rectangle
        height={height}
        width={width}
        x={props.cx}
        y={props.cy}
        fill={"none"}
        stroke={color}
        strokeWidth={chartProps.pointSize / 10}
      />
    );
  }
  return (
    <>
      {text}
      {rect}
      {path}
    </>
  );
};

const CustomizedYAxisTick = ({
  props,
  buckets,
  orientation,
  fmt,
  translations,
  pointSize,
  yLabels,
  valueType,
  bounds,
  maxLabel,
  showLabels,
  marginRight,
  marginWidth,
  plotWidth,
}) => {
  const {
    x,
    y,
    fill,
    index,
    height,
    width,
    payload,
    orientation: side,
  } = props;
  let value = payload.value;
  let offset = 0;
  let h = height / (buckets.length - 1);
  let centered;
  let ttValue;
  if (yLabels[index] != payload.value) {
    value = yLabels[index] || "";
    if (valueType == "coordinate") {
      let yScale = scaleLinear().domain(bounds.domain).range([0, height]);
      h = yScale(buckets[index + 1]) - yScale(buckets[index]);
    }
    ttValue = value;
    offset = h / 2;
    centered = true;
  } else {
    if (index > 0) {
      ttValue = `${fmt(yLabels[index - 1])}-${fmt(yLabels[index])}`;
    }
    value = fmt(value);
  }
  let text;
  let rect;
  let ori;
  let oriWidth = 2;
  let textValue = translations[value] || value;
  ttValue = translations[ttValue] || ttValue;
  if (showLabels) {
    if (h >= pointSize * 0.8) {
      text = (
        <text
          x={0}
          y={0}
          textAnchor="end"
          alignmentBaseline={"middle"}
          dominantBaseline={"middle"}
          fill={fill}
          fontSize={pointSize}
          // fontWeight={orientation && orientation[index] < 0 ? "bold" : "normal"}
          // transform={"rotate(-90)"}
        >
          {textValue}
        </text>
      );
    } else {
      text = (
        <line
          x1={0}
          y1={0}
          x2={-maxLabel * 0.8}
          y2={0}
          stroke={"rgb(125,125,125)"}
          strokeDasharray={pointSize / 5}
          strokeWidth={pointSize / 10}
        />
      );
      rect = (
        <Tooltip title={textValue} arrow placement="right">
          <Rectangle
            className={styles.active}
            x={-maxLabel}
            y={-offset}
            height={h}
            width={maxLabel}
            stroke={"none"}
            fill={"rgb(125,125,125)"}
            fillOpacity={0}
          />
        </Tooltip>
      );
    }
  } else if (ttValue) {
    rect = (
      <g>
        <Tooltip title={ttValue} arrow placement="right">
          <Rectangle
            className={styles.active}
            x={-pointSize}
            y={centered ? -offset : 0}
            height={h}
            width={plotWidth - marginWidth - marginRight - 110 + pointSize}
            stroke={"none"}
            fill={"rgb(200,200,200)"}
            fillOpacity={0}
          />
        </Tooltip>
        <Rectangle
          x={10}
          y={centered ? -offset : 0}
          height={h}
          width={plotWidth - marginWidth - marginRight - 120}
          stroke={"none"}
          fill={"rgb(255,255,255)"}
          fillOpacity={0}
        />
      </g>
    );
  }
  if (
    orientation &&
    orientation[yLabels[index]] &&
    orientation[yLabels[index]] < 0
  ) {
    ori = (
      <g>
        <Rectangle
          className={styles.active}
          x={side == "left" ? 10 - oriWidth : -7}
          y={-offset}
          height={h}
          width={oriWidth}
          stroke={"none"}
          fill={fill}
        />
      </g>
    );
  }
  return (
    <g transform={`translate(${x - 2},${y - offset})`}>
      {ori}
      {side == "left" && rect}
      {side == "left" && text}
    </g>
  );
};

const Heatmap = ({
  data,
  pointData,
  width,
  marginWidth,
  marginHeight,
  marginRight,
  height,
  cats,
  buckets,
  yBuckets,
  yOrientation,
  chartProps,
  endLabel,
  lastIndex,
  highlightArea,
  xLabel,
  yLabel,
  stacked,
  highlight,
  colors,
  legendRows,
}) => {
  const fadeColor = ({ hex, i, active }) => {
    let [h, s, l] = hexToHSL(hex);
    let lighten = active !== false ? (i == active ? false : true) : false;
    if (lighten) {
      s = 15; // s / 2;
      l = (l + 100) / 2;
    }
    return `hsl(${h},${s}%,${l}%)`;
  };
  const [currentSeries, setCurrentSeries] = useState(false);
  let fillColors = colors.map((hex, i) =>
    fadeColor({ hex, i, active: currentSeries })
  );
  let orderedCats = [...cats];
  let catOrder = cats
    .map((cat, i) => ({ [cat]: i }))
    .reduce((a, b) => ({ ...b, ...a }), {});
  if (currentSeries !== false) {
    let [lastCat] = orderedCats.splice(currentSeries, 1);
    orderedCats.push(lastCat);
  }
  let xScale =
    chartProps.bounds.scale == "ordinal" ? "linear" : chartProps.bounds.scale;
  let yScale =
    chartProps.yBounds.scale == "ordinal" ? "linear" : chartProps.yBounds.scale;
  let xDomain = isNaN(buckets[0])
    ? [0, buckets.length - 1]
    : [buckets[0], buckets[buckets.length - 1]];
  let yDomain = isNaN(yBuckets[0])
    ? [0, yBuckets.length - 1]
    : [yBuckets[0], yBuckets[yBuckets.length - 1]];
  let axes = [
    <CartesianGrid key={"grid"} strokeDasharray="3 3" />,
    <XAxis
      type="number"
      dataKey="x"
      key={"x"}
      scale={axisScales[xScale]()}
      angle={buckets.length > 15 ? -90 : 0}
      domain={xDomain}
      range={xDomain}
      ticks={isNaN(buckets[0]) ? buckets.map((x, i) => i) : buckets}
      tick={(props) =>
        ReportXAxisTick({
          props,
          buckets,
          fmt: chartProps.xFormat,
          translations: chartProps.translations,
          pointSize: chartProps.pointSize,
          orientation: chartProps.orientation,
          labels: chartProps.labels,
          valueType: chartProps.valueType,
          bounds: chartProps.bounds,
          maxLabel: chartProps.maxXlabel,
          showLabels: chartProps.showLabels,
          marginTop,
        })
      }
      tickFormatter={chartProps.showXTickLabels ? chartProps.xFormat : () => ""}
      interval={0}
      style={{ textAnchor: buckets.length > 15 ? "end" : "auto" }}
    >
      <Label
        value={xLabel}
        // offset={buckets.length > 15 ? chartProps.pointSize + 10 : 10}
        offset={marginHeight - chartProps.pointSize}
        dy={0}
        position="bottom"
        dominantBaseline={"text-after-edge"}
        fill="#666"
        fontSize={chartProps.pointSize}
        fontWeight="bold"
        pointerEvents={"none"}
      />
    </XAxis>,
    <YAxis
      type="number"
      dataKey="y"
      key={"y"}
      scale={axisScales[yScale]()}
      ticks={isNaN(yBuckets[0]) ? yBuckets.map((y, i) => i) : yBuckets}
      tick={(props) =>
        CustomizedYAxisTick({
          props,
          buckets: yBuckets,
          orientation: yOrientation,
          fmt: chartProps.yFormat,
          translations: chartProps.yTranslations,
          pointSize: chartProps.pointSize,
          yLabels: chartProps.yLabels,
          valueType: chartProps.yValueType,
          bounds: chartProps.yBounds,
          maxLabel: chartProps.maxYLabel,
          showLabels: chartProps.showLabels,
          plotWidth: width,
          marginWidth,
          marginRight,
        })
      }
      domain={yDomain}
      // domain={["auto", "auto"]}
      // range={["auto", "auto"]}
      range={yDomain}
      tickFormatter={chartProps.showYTickLabels ? chartProps.yFormat : () => ""}
      interval={0}
    >
      <Label
        value={yLabel}
        offset={marginWidth + 60 - chartProps.pointSize}
        position="insideRight"
        fill="#666"
        angle={-90}
        style={{ textAnchor: "middle" }}
        fontSize={chartProps.pointSize}
        fontWeight="bold"
        pointerEvents={"none"}
      />
    </YAxis>,
    <YAxis
      type="number"
      dataKey="y"
      key={"y2"}
      yAxisId={"y2"}
      axisLine={false}
      tickLine={false}
      orientation={"right"}
      scale={axisScales[yScale]()}
      ticks={isNaN(yBuckets[0]) ? yBuckets.map((y, i) => i) : yBuckets}
      tick={(props) =>
        CustomizedYAxisTick({
          props,
          buckets: yBuckets,
          orientation: yOrientation,
          fmt: chartProps.yFormat,
          translations: chartProps.yTranslations,
          pointSize: chartProps.pointSize,
          yLabels: chartProps.yLabels,
          valueType: chartProps.yValueType,
          bounds: chartProps.yBounds,
          maxLabel: chartProps.maxYLabel,
          plotWidth: width,
          marginWidth,
          marginRight,
        })
      }
      domain={yDomain}
      range={yDomain}
      tickFormatter={() => ""}
      interval={0}
    />,
    <ZAxis
      id={0}
      type="number"
      key={"z"}
      dataKey="count"
      domain={[chartProps.zDomain[0], chartProps.zDomain[1]]}
      range={[0.1, 1]}
      scale="sqrt"
    ></ZAxis>,
  ];

  let highlightRect;
  if (highlightArea) {
    let parts = highlightArea.split(/(?:,\s*)/);
    let coords, eqn, label;
    if (parts[0].startsWith("y=")) {
      eqn = parts[0]
        .replace("y=", "")
        .match(/\s*([-\d\.]*)\s*x\s*([\*|\^]*)(-*[\d\.]*)\s*\+*\s*(-*[\d\.]*)/);
      if (parts[1]) {
        label = parts[1];
      }
      coords = {
        x: xDomain[0],
        y: yDomain[0],
        xBound: xDomain[1],
        yBound: yDomain[1],
        label,
      };
    } else if (parts.length >= 4) {
      coords = {
        x: parts[0] * 1,
        y: parts[1] * 1,
        xBound: parts[2] * 1,
        yBound: parts[3] * 1,
      };
      if (parts[4]) {
        coords.label = parts[4];
      }
    }
    if (coords) {
      highlightRect = (
        <Scatter
          key={"highlightArea"}
          data={[coords]}
          shape={(props) => HighlightShape(props, { ...chartProps, eqn })}
          isAnimationActive={false}
          legendType="none"
        />
      );
    }
  }
  let marginTop = 5;
  if (legendRows) {
    if (chartProps.compactLegend) {
      marginTop += legendRows * (chartProps.pointSize + 10);
    } else {
      marginTop += legendRows * (2 * chartProps.pointSize + 15);
    }
  }

  return (
    <ScatterChart
      width={width}
      height={height}
      data={data}
      margin={{
        top: marginTop,
        right: marginRight,
        left: marginWidth,
        bottom: marginHeight,
      }}
    >
      {axes}
      {pointData &&
        orderedCats.map((cat, j) => {
          let i = catOrder[cat];
          let range = [Math.max()];
          return (
            <Scatter
              name={`${cat}_points`}
              legendType="none"
              key={i}
              data={pointData[i]}
              fill={fillColors[i] || "rgb(102, 102, 102)"}
              shape={(props) =>
                CustomCircle(props, {
                  ...chartProps,
                  active: currentSeries === false || currentSeries == i,
                })
              }
              zAxisId={1}
              isAnimationActive={false}
              pointerEvents={"none"}
            />
          );
        })}
      {pointData && highlight && (
        <Scatter
          name={"highlight"}
          legendType="none"
          key={"highlight"}
          data={highlight}
          fill={"yellow"}
          shape={(props) =>
            CustomDot(props, {
              ...chartProps,
            })
          }
          zAxisId={1}
          isAnimationActive={false}
          style={{ pointerEvents: "none" }}
        />
      )}
      {cats.map((cat, i) => {
        let handleClick;
        if (pointData && cats.length > 1) {
          handleClick = (i) => {
            currentSeries !== false && currentSeries == i
              ? setCurrentSeries(false)
              : setCurrentSeries(i);
          };
        }
        return (
          <Scatter
            name={cat}
            key={cat}
            data={data[i]}
            fill={fillColors[i] || "rgb(102, 102, 102)"}
            shape={(props) =>
              CustomShape(
                props,
                {
                  ...chartProps,
                  i,
                  currentSeries,
                  active: currentSeries === false || currentSeries == i,
                },
                handleClick
              )
            }
            isAnimationActive={false}
          />
        );
      })}
      {highlightRect}
    </ScatterChart>
  );
};

const ReportScatter = ({
  scatter,
  chartRef,
  report,
  containerRef,
  embedded,
  compactLegend,
  compactWidth = 600,
  ratio,
  zScale = "linear",
  setMessage,
  reportSelect,
  reportTerm,
  colors,
  levels,
  minDim,
  setMinDim,
  xOpts,
  yOpts,
  stacked,
  highlightArea,
  basename,
  pointSize = 15,
}) => {
  pointSize *= 1;
  const navigate = useNavigate();
  const location = useLocation();
  const [highlight, setHighlight] = useState([]);
  const componentRef = chartRef ? chartRef : useRef();
  const { width, height } = containerRef
    ? useResize(containerRef)
    : useResize(componentRef);
  useEffect(() => {
    if (scatter && scatter.status) {
      setMessage(null);
    }
  }, [scatter]);

  let locations = {};
  if (scatter && scatter.status) {
    let scatterReport = scatter.report.scatter || scatter.report.oxford;
    let chart;
    let {
      bounds,
      yBounds,
      cats,
      catSums,
      chartData,
      histograms: heatmaps,
      pointData,
      groupBy,
    } = scatterReport;
    if (pointData) {
      ({ locations } = scatterReport);
    }
    useEffect(() => {
      if (locations[reportTerm]) {
        setHighlight([locations[reportTerm]]);
      } else {
        setHighlight([]);
      }
    }, [reportTerm]);
    if (!heatmaps) {
      return null;
    }
    let hasRawData = pointData && pointData.length > 0;
    let xOptions = (xOpts || "").split(";");
    if (xOptions.length == 1) {
      xOptions = xOptions[0].split(",");
    }
    let yOptions = (yOpts || "").split(";");
    if (yOptions.length == 1) {
      yOptions = yOptions[0].split(",");
    }
    let xLabel = xOptions[4] || scatter.report.xLabel;
    let yLabel = yOptions[4] || scatter.report.yLabel;
    let valueType = heatmaps.valueType;
    let yValueType = heatmaps.yValueType || "integer";
    let summary = heatmaps.summary;
    let ySummary = heatmaps.ySummary || "value";
    let lastIndex = heatmaps.buckets.length - 2;
    let interval;
    if (valueType == "date") {
      let start = heatmaps.buckets[0];
      let end = heatmaps.buckets[lastIndex + 1];
      let diff = end - start;
      interval = setInterval(diff, lastIndex);
    }
    let yInterval;
    if (yValueType == "date") {
      let start = heatmaps.yBuckets[0];
      let end = heatmaps.yBuckets[heatmaps.yBuckets.length - 1];
      let diff = end - start;
      yInterval = setInterval(diff, heatmaps.yBuckets.length - 1);
    }

    let endLabel = formats(
      heatmaps.buckets[lastIndex + 1],
      valueType,
      interval
    );
    compactLegend =
      typeof compactLegend !== "undefined"
        ? compactLegend
        : typeof embedded === "undefined" || width < compactWidth;

    const {
      translations,
      catTranslations,
      catOffsets,
      legendRows,
      yTranslations,
    } = processLegendData({
      bounds,
      yBounds,
      minWidth: compactLegend ? 50 : 10 * pointSize,
      width,
      pointSize,
    });
    if (cats && cats.length > 1 && levels[cats.length]) {
      colors = levels[cats.length];
    }
    const xFormat = (value) => formats(value, valueType, interval);
    const yFormat = (value) => formats(value, yValueType, yInterval);

    let labels = bounds.labels || heatmaps.buckets;
    let yLabels = yBounds.labels || heatmaps.yBuckets;
    let showLabels = width >= compactWidth;
    const maxYLabel = showLabels
      ? maxStringLength(yLabels, yFormat, pointSize)
      : 0;
    const marginWidth = showLabels
      ? maxYLabel + pointSize > 40
        ? maxYLabel + pointSize - 40
        : 0
      : pointSize - 35;
    const maxXLabel = showLabels
      ? maxStringLength(labels, xFormat, pointSize)
      : 0;
    let marginHeight = showLabels ? 2 * pointSize : pointSize - 15;
    const marginRight = showLabels
      ? (stringLength(xFormat(endLabel)) * pointSize) / 2
      : 0;
    let orientation = 0;
    if (
      maxXLabel >
      (width - marginWidth - marginRight) / heatmaps.buckets.length
    ) {
      orientation = -90;
      marginHeight =
        maxXLabel + pointSize > 20 ? maxXLabel + pointSize - 20 : 0;
    }
    chart = (
      <Heatmap
        data={chartData}
        pointData={1 ? pointData : []}
        width={width}
        height={minDim - (showLabels ? 50 : 0)}
        marginWidth={marginWidth}
        marginHeight={marginHeight}
        marginRight={marginRight}
        buckets={heatmaps.buckets}
        yBuckets={heatmaps.yBuckets}
        yOrientation={heatmaps.yOrientation}
        labels={labels}
        yLabels={yLabels}
        cats={cats}
        xLabel={xLabel}
        yLabel={yLabel}
        endLabel={endLabel}
        lastIndex={lastIndex}
        highlight={highlight}
        highlightArea={highlightArea}
        colors={colors}
        legendRows={legendRows}
        chartProps={{
          zDomain: heatmaps.zDomain,
          yLength: heatmaps.yBuckets.length - 1,
          xLength: heatmaps.buckets.length - 1,
          n: cats.length,
          zScale: zScale,
          report,
          catSums,
          pointSize,
          pointRatio: scatter.report.oxford ? 0.5 : 1,
          groupBy,
          selectMode: reportSelect,
          xQuery: scatter.report.xQuery,
          yQuery: scatter.report.yQuery,
          maxYLabel,
          maxXLabel,
          xLabel: scatter.report.xLabel,
          yLabel: scatter.report.yLabel,
          showXTickLabels: xOptions[2]
            ? xOptions[2] >= 0
              ? true
              : false
            : true,
          showYTickLabels: yOptions[2]
            ? yOptions[2] >= 0
              ? true
              : false
            : true,
          xFormat,
          yFormat,
          orientation,
          fields: heatmaps.fields,
          ranks: heatmaps.ranks,
          bounds,
          yBounds,
          translations,
          yTranslations,
          catTranslations,
          catOffsets,
          buckets: heatmaps.buckets,
          yBuckets: heatmaps.yBuckets,
          labels,
          yLabels,
          showLabels,
          valueType,
          yValueType,
          summary,
          ySummary,
          stacked,
          hasRawData,
          embedded,
          navigate,
          location,
          basename,
          compactLegend,
        }}
      />
    );
    return (
      <Grid item xs ref={componentRef} style={{ height: "100%" }}>
        {chart}
      </Grid>
    );
  } else {
    return null;
  }
};

export default compose(
  withSiteName,
  dispatchMessage,
  withColors,
  withReportTerm
)(ReportScatter);
