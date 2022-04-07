// import { RadialChart } from "react-vis";
import {
  CartesianGrid,
  Dot,
  Label,
  Legend,
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
import { useLocation, useNavigate } from "@reach/router";

import CellInfo from "./CellInfo";
import Grid from "@material-ui/core/Grid";
import Tooltip from "@material-ui/core/Tooltip";
import axisScales from "../functions/axisScales";
import { compose } from "recompose";
import dispatchMessage from "../hocs/dispatchMessage";
import { format } from "d3-format";
// import { point } from "leaflet";
import qs from "qs";
import styles from "./Styles.scss";
import useResize from "../hooks/useResize";
import withColors from "../hocs/withColors";
import withReportTerm from "../hocs/withReportTerm";

const searchByCell = ({
  xQuery,
  yQuery,
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
}) => {
  let query = xQuery.query;
  query = query
    .replaceAll(new RegExp("AND\\s+" + bounds.field + "\\s+AND", "gi"), "AND")
    .replaceAll(
      new RegExp("AND\\s+" + bounds.field + "\\s+>=\\s*[\\w\\d_]+", "gi"),
      ""
    )
    .replaceAll(
      new RegExp("AND\\s+" + bounds.field + "\\s+<\\s*[\\w\\d_]+", "gi"),
      ""
    )
    .replaceAll(/\s+/g, " ")
    .replace(/\s+$/, "");
  if (valueType == "date") {
    query += ` AND ${bounds.field} >= ${
      new Date(xRange[0]).toISOString().split(/t/i)[0]
    } AND ${bounds.field} < ${
      new Date(xRange[1]).toISOString().split(/t/i)[0]
    }`;
  } else if (valueType == "keyword") {
    query += ` AND ${bounds.field} = ${bounds.stats.cats[xRange[0]].key}`;
  } else {
    query += ` AND ${bounds.field} >= ${xRange[0]} AND ${bounds.field} < ${xRange[1]}`;
  }
  if (yValueType == "date") {
    query += ` AND ${yBounds.field} >= ${
      new Date(yRange[0]).toISOString().split(/t/i)[0]
    } AND ${yBounds.field} < ${
      new Date(yRange[1]).toISOString().split(/t/i)[0]
    }`;
  } else if (yValueType == "keyword") {
    query += ` AND ${yBounds.field} = ${yBounds.stats.cats[yRange[0]].key}`;
  } else {
    query += ` AND ${yBounds.field} >= ${yRange[0]} AND ${yBounds.field} < ${yRange[1]}`;
  }

  // let fields = `${xLabel},${yLabel}`;
  let options = qs.parse(location.search.replace(/^\?/, ""));
  if (options.sortBy && !fields.includes(options.sortBy)) {
    delete options.sortBy;
    delete options.sortOrder;
  }
  options.offset = 0;
  fields = fields.join(",");
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
    y: yQuery.query,
    fields,
    report: "scatter",
    ranks,
  });

  // let hash = encodeURIComponent(query);
  navigate(
    `/search?${queryString.replace(/^\?/, "")}#${encodeURIComponent(query)}`
  );
};

const CustomDot = (props, chartProps) => {
  let { cx, cy, height: r, fill } = props;
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={r}
      stroke={fill}
      fill={"none"}
      strokeWidth={r / 2}
    />
  );
};

const CustomShape = (props, chartProps) => {
  let h = props.yAxis.height / chartProps.yLength;
  if (chartProps.yValueType == "date") {
    h =
      props.yAxis.scale(props.payload.y) -
      props.yAxis.scale(props.payload.yBound);
  }
  let height = h / chartProps.n;
  let w = props.xAxis.width / chartProps.xLength;
  if (chartProps.valueType == "date") {
    w =
      props.xAxis.scale(props.payload.xBound) -
      props.xAxis.scale(props.payload.x);
  }
  let heatRect;
  let xRange, yRange;
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
  let bgRect = (
    <>
      <Tooltip
        title={<CellInfo x={xRange} y={yRange} count={props.payload.count} />}
        arrow
      >
        <Rectangle
          height={h}
          width={w}
          x={props.cx}
          y={props.cy - h}
          style={chartProps.embedded ? {} : { cursor: "pointer" }}
          fill={"rgba(255,255,255,0)"}
          onClick={
            chartProps.embedded
              ? () => {}
              : () =>
                  searchByCell({
                    ...chartProps,
                    xRange: [props.payload.x, props.payload.xBound],
                    yRange: [props.payload.y, props.payload.yBound],
                  })
          }
        />
      </Tooltip>
    </>
  );
  if (!chartProps.hasRawData) {
    let z = props.payload.z;
    let scale = axisScales[chartProps.zScale]();
    let domain = [1, chartProps.zDomain[1]];
    scale.domain(domain).range([2, w]);
    if (chartProps.n == 1) {
      scale.range([0.1, 1]);
    } else if (chartProps.zScale == "proportion") {
      scale.domain([0, 1]).range([0, w]);
      z /= chartProps.catSums[props.name];
    }
    let width = scale(z);
    heatRect = (
      <Rectangle
        {...props}
        height={chartProps.n > 1 ? height : h}
        width={chartProps.n > 1 ? width : w}
        // mask={`url(#mask-stripe-${chartProps.n}-${chartProps.i})`}
        fill={props.fill}
        x={props.cx} // {props.cx + (w - width) / 2}
        y={
          chartProps.n > 1 ? props.cy - h + height * chartProps.i : props.cy - h
        }
        // fillOpacity={chartProps.n > 1 ? 1 : props.zAxis.scale(props.payload.z)}
        fillOpacity={chartProps.n > 1 ? 1 : scale(props.payload.z)}
        style={{ pointerEvents: "none" }}
      />
    );
  }

  return (
    <>
      {bgRect}
      {heatRect}
    </>
  );
};

const HighlightShape = (props, chartProps) => {
  let { cx, cy, xAxis, yAxis } = props;
  let { x, y, xBound, yBound, label } = props.payload;
  let height = yAxis.scale(yBound) - cy;
  let width = xAxis.scale(xBound) - cx;
  let text;
  let color = "black";
  if (label) {
    text = (
      <Text
        x={cx + width}
        y={y > yAxis.domain[0] ? cy + 2 : cy + height - 2}
        fill={color}
        dominantBaseline={y > yAxis.domain[0] ? "hanging" : "auto"}
        textAnchor={"end"}
      >
        {label}
      </Text>
    );
  }
  return (
    <>
      {text}
      <Rectangle
        height={height}
        width={width}
        x={props.cx}
        y={props.cy}
        fill={"none"}
        stroke={color}
      />
    </>
  );
};

const CustomizedYAxisTick = (props, buckets, fmt) => {
  const { x, y, fill, index, height, payload } = props;
  let value = payload.value;
  let offset = 0;
  if (buckets[index] != payload.value) {
    value = buckets[index] || "";
    offset = height / (buckets.length - 1) / 2;
  } else {
    value = fmt(value);
  }
  return (
    <g transform={`translate(${x - 16},${y - offset})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill={fill}
        transform={"rotate(-90)"}
      >
        {value}
      </text>
    </g>
  );
};

const CustomizedXAxisTick = (props, buckets, fmt) => {
  const { x, y, fill, index, width, payload } = props;
  let value = payload.value;
  let offset = 0;
  if (buckets[index] != payload.value) {
    value = buckets[index] || "";
    offset = width / (buckets.length - 1) / 2;
  } else {
    value = fmt(value);
  }
  return (
    <g transform={`translate(${x + offset},${y})`}>
      <text x={0} y={0} dy={10} textAnchor="middle" fill={fill}>
        {value}
      </text>
    </g>
  );
};

const Heatmap = ({
  data,
  pointData,
  width,
  height,
  cats,
  buckets,
  yBuckets,
  chartProps,
  endLabel,
  lastIndex,
  highlightArea,
  xLabel,
  yLabel,
  stacked,
  highlight,
  colors,
}) => {
  let xScale =
    chartProps.bounds.scale == "ordinal" ? "linear" : chartProps.bounds.scale;
  let yScale =
    chartProps.yBounds.scale == "ordinal" ? "linear" : chartProps.yBounds.scale;
  let axes = [
    <CartesianGrid key={"grid"} strokeDasharray="3 3" />,
    <XAxis
      type="number"
      dataKey="x"
      key={"x"}
      scale={axisScales[xScale]()}
      angle={buckets.length > 15 ? -90 : 0}
      domain={
        isNaN(buckets[0])
          ? [0, buckets.length - 1]
          : [buckets[0], buckets[buckets.length - 1]]
      }
      range={
        isNaN(buckets[0])
          ? [0, buckets.length - 1]
          : [buckets[0], buckets[buckets.length - 1]]
      }
      ticks={isNaN(buckets[0]) ? buckets.map((x, i) => i) : buckets}
      tick={(props) => CustomizedXAxisTick(props, buckets, chartProps.xFormat)}
      tickFormatter={chartProps.showXTickLabels ? chartProps.xFormat : () => ""}
      interval={0}
      style={{ textAnchor: buckets.length > 15 ? "end" : "auto" }}
    >
      <Label
        value={xLabel}
        offset={buckets.length > 15 ? 20 : 0}
        position="bottom"
        fill="#666"
      />
    </XAxis>,
    <YAxis
      type="number"
      dataKey="y"
      key={"y"}
      scale={axisScales[yScale]()}
      ticks={isNaN(yBuckets[0]) ? yBuckets.map((y, i) => i) : yBuckets}
      tick={(props) => CustomizedYAxisTick(props, yBuckets, chartProps.yFormat)}
      domain={
        isNaN(yBuckets[0])
          ? [0, yBuckets.length - 1]
          : [yBuckets[0], yBuckets[yBuckets.length - 1]]
      }
      // domain={["auto", "auto"]}
      // range={["auto", "auto"]}
      range={
        isNaN(yBuckets[0])
          ? [0, yBuckets.length - 1]
          : [yBuckets[0], yBuckets[yBuckets.length - 1]]
      }
      tickFormatter={chartProps.showYTickLabels ? chartProps.yFormat : () => ""}
      interval={0}
    >
      <Label
        value={yLabel}
        offset={0}
        position="left"
        fill="#666"
        angle={-90}
        style={{ textAnchor: "middle" }}
      />
    </YAxis>,
    <ZAxis
      id={0}
      type="number"
      key={"z"}
      dataKey="count"
      domain={[chartProps.zDomain[0], chartProps.zDomain[1]]}
      range={[0.1, 1]}
      scale="sqrt"
    ></ZAxis>,
    // <Tooltip />,
  ];
  if (width > 300) {
    axes.push(
      <Legend key={"legend"} verticalAlign="top" offset={28} height={28} />
    );
  }

  // let stripe = 4;
  // let angle = 90;
  // const patterns = (
  //   <defs>
  //     {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
  //       <>
  //         {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => (
  //           <>
  //             <pattern
  //               id={`pattern-stripe-${i}-${j}`}
  //               width={i * stripe}
  //               height={i * stripe}
  //               patternUnits="userSpaceOnUse"
  //               patternTransform={`rotate(${angle}) translate(${stripe * j})`}
  //             >
  //               <rect
  //                 width={stripe}
  //                 height={i * stripe}
  //                 transform="translate(0,0)"
  //                 fill="white"
  //               ></rect>
  //             </pattern>
  //             <mask id={`mask-stripe-${i}-${j}`}>
  //               <rect
  //                 x="0"
  //                 y="0"
  //                 width="100%"
  //                 height="100%"
  //                 fill={`url(#pattern-stripe-${i}-${j})`}
  //               />
  //             </mask>
  //           </>
  //         ))}
  //       </>
  //     ))}
  //   </defs>
  // );

  let highlightRect;
  if (highlightArea) {
    let parts = highlightArea.split(/(?:,\s*)/);
    if (parts.length >= 4) {
      let coords = {
        x: parts[0] * 1,
        y: parts[1] * 1,
        xBound: parts[2] * 1,
        yBound: parts[3] * 1,
      };
      if (parts[4]) {
        coords.label = parts[4];
      }

      highlightRect = (
        <Scatter
          key={"highlightArea"}
          data={[coords]}
          shape={(props) => HighlightShape(props, { ...chartProps })}
          isAnimationActive={false}
          legendType="none"
        />
      );
    }
  }

  return (
    <ScatterChart
      width={width}
      height={height}
      data={data}
      margin={{
        top: 5,
        right: 30,
        left: 20,
        bottom: width > 300 ? (buckets.length > 15 ? 35 : 25) : 5,
      }}
    >
      {/* {patterns} */}
      {axes}
      {cats.map((cat, i) => (
        <Scatter
          name={cat}
          key={cat}
          data={data[i]}
          fill={colors[i]}
          shape={(props) => CustomShape(props, { ...chartProps, i })}
          isAnimationActive={false}
        />
      ))}
      {pointData &&
        cats.map((cat, i) => (
          <Scatter
            name={`${cat}_points`}
            legendType="none"
            key={i}
            data={pointData[i]}
            fill={colors[i]}
            shape={"circle"}
            zAxisId={1}
            isAnimationActive={false}
            style={{ pointerEvents: "none" }}
          />
        ))}
      {pointData && highlight && (
        <Scatter
          name={"highlight"}
          legendType="none"
          key={"highlight"}
          data={highlight}
          fill={"yellow"}
          shape={(props) => CustomDot(props, { ...chartProps })}
          zAxisId={1}
          isAnimationActive={false}
          style={{ pointerEvents: "none" }}
        />
      )}
      {highlightRect}
    </ScatterChart>
  );
};

const ReportScatter = ({
  scatter,
  chartRef,
  containerRef,
  embedded,
  ratio,
  zScale = "linear",
  setMessage,
  reportTerm,
  colors,
  minDim,
  setMinDim,
  xOpts,
  yOpts,
  highlightArea,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [highlight, setHighlight] = useState([]);
  const componentRef = chartRef ? chartRef : useRef();
  const { width, height } = containerRef
    ? useResize(containerRef)
    : useResize(componentRef);
  // useEffect(() => {
  //   let newMinDim;
  //   if (height) {
  //     newMinDim = Math.floor(Math.min(width, height));
  //   } else if (width) {
  //     newMinDim = Math.floor(width) / ratio;
  //   }
  //   if (newMinDim) {
  //     setMinDim(newMinDim);
  //   }
  // }, [width, height]);
  useEffect(() => {
    if (scatter && scatter.status) {
      setMessage(null);
    }
  }, [scatter]);

  let locations = {};
  if (scatter && scatter.status) {
    let chart;
    let {
      bounds,
      yBounds,
      cats,
      catSums,
      chartData,
      histograms: heatmaps,
      pointData,
    } = scatter.report.scatter;
    if (pointData) {
      ({ locations } = scatter.report.scatter);
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
    let xOptions = (xOpts || "").split(",");
    let yOptions = (yOpts || "").split(",");
    let xLabel = xOptions[4] || scatter.report.xLabel;
    let yLabel = yOptions[4] || scatter.report.yLabel;
    let valueType = heatmaps.valueType;
    let yValueType = heatmaps.yValueType || "integer";
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
    chart = (
      <Heatmap
        data={chartData}
        pointData={1 ? pointData : []}
        width={width}
        height={minDim - 50}
        buckets={heatmaps.buckets}
        yBuckets={heatmaps.yBuckets}
        cats={cats}
        xLabel={xLabel}
        yLabel={yLabel}
        endLabel={endLabel}
        lastIndex={lastIndex}
        highlight={highlight}
        highlightArea={highlightArea}
        colors={colors}
        chartProps={{
          zDomain: heatmaps.zDomain,
          yLength: heatmaps.yBuckets.length - 1,
          xLength: heatmaps.buckets.length - 1,
          n: cats.length,
          zScale: zScale,
          catSums,
          xQuery: scatter.report.xQuery,
          yQuery: scatter.report.yQuery,
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
          xFormat: (value) => formats(value, valueType, interval),
          yFormat: (value) => formats(value, yValueType, yInterval),
          fields: heatmaps.fields,
          ranks: heatmaps.ranks,
          bounds,
          yBounds,
          valueType,
          yValueType,
          hasRawData,
          embedded,
          navigate,
          location,
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
  dispatchMessage,
  withColors,
  withReportTerm
)(ReportScatter);
