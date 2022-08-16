// import { RadialChart } from "react-vis";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Legend,
  Rectangle,
  XAxis,
  YAxis,
} from "recharts";
import MultiCatLegend, { processLegendData } from "./MultiCatLegend";
import React, { Fragment, useEffect, useRef } from "react";
import formats, { setInterval } from "../functions/formats";
import { useLocation, useNavigate } from "@reach/router";

import CellInfo from "./CellInfo";
import Grid from "@material-ui/core/Grid";
import Tooltip from "@material-ui/core/Tooltip";
import axisScales from "../functions/axisScales";
import { compose } from "recompose";
import dispatchMessage from "../hocs/dispatchMessage";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import useResize from "../hooks/useResize";
import withColors from "../hocs/withColors";
import withSiteName from "../hocs/withSiteName";

const renderXTick = (tickProps) => {
  const {
    x,
    y,
    index,
    endLabel,
    lastIndex,
    payload,
    chartWidth,
    visibleTicksCount,
    showTickLabels,
    scale,
    translations,
  } = tickProps;
  let { value, offset } = payload;
  let textOffset = 0;
  if (scale == "ordinal") {
    textOffset = chartWidth / visibleTicksCount / 2;
  }
  // if (month % 3 === 1) {
  //   return <text x={x} y={y - 4} textAnchor="middle">{`Q${quarterNo}`}</text>;
  // }

  // const isLast = month === 11;

  // if (month % 3 === 0 || isLast) {
  let endTick;
  let pathX;
  if (index == lastIndex) {
    pathX = Math.floor(x + offset) + 0.5;
    endTick = (
      <>
        {showTickLabels && (
          <text
            x={pathX + textOffset}
            y={y + 14}
            textAnchor="middle"
            fill="#666"
          >
            {endLabel}
          </text>
        )}
        <path d={`M${pathX},${y - 8}v${6}`} stroke="#666" />
      </>
    );
  }
  pathX = Math.floor(x - offset) + 0.5;
  let showTickLabel = showTickLabels;
  if (chartWidth < 300 && index > 0) {
    showTickLabel = false;
  } else if (chartWidth / visibleTicksCount < 50) {
    if (endTick || index % 2 != 0) {
      showTickLabel = false;
    }
  }
  return (
    <g>
      {showTickLabel && (
        <text x={pathX + textOffset} y={y + 14} textAnchor="middle" fill="#666">
          {translations[value] || value}
        </text>
      )}
      <path d={`M${pathX},${y - 8}v${6}`} stroke="#666" />
      {endTick}
    </g>
  );
  // }
  // return null;
};

const searchByCell = ({
  xQuery,
  xLabel,
  xBounds,
  bounds,
  location,
  navigate,
  fields,
  ranks,
  basename,
}) => {
  let query = xQuery.query;
  query = query
    .replaceAll(new RegExp("AND\\s+" + bounds.field + "\\s+AND", "gi"), "AND")
    .replaceAll(
      new RegExp("AND\\s+" + bounds.field + "\\s+>=*\\s*[\\w\\d_\\.-]+", "gi"),
      ""
    )
    .replaceAll(
      new RegExp("AND\\s+" + bounds.field + "\\s+<=*\\s*[\\w\\d_\\.-]+", "gi"),
      ""
    )
    .replaceAll(/\s+/g, " ")
    .replace(/\s+$/, "");
  if (bounds.scale == "ordinal") {
    query += ` AND ${bounds.field} = ${xBounds[0]}`;
  } else {
    query += ` AND ${bounds.field} >= ${xBounds[0]} AND ${bounds.field} < ${xBounds[1]}`;
  }

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
  let xOpts = (options.xOpts || "").split(";");
  if (xOpts.length == 1) {
    xOpts = xOpts[0].split(",");
  }
  if (xOpts.length > 1) {
    xOpts[0] = "";
    xOpts[1] = "";
  }
  xOpts = xOpts.join(";");

  let queryString = qs.stringify({
    ...xQuery,
    ...options,
    xOpts,
    query,
    fields,
    report: "histogram",
    ranks,
  });
  // let hash = encodeURIComponent(query);
  navigate(
    `${basename}/search?${queryString.replace(/^\?/, "")}#${encodeURIComponent(
      query
    )}`
  );
};

const CustomBackground = ({ chartProps, ...props }) => {
  let legendGroup = null;
  let offset, row;
  if (chartProps.catOffsets[chartProps.name]) {
    ({ offset, row } = chartProps.catOffsets[chartProps.name]);
  }
  if (props.index == 0) {
    legendGroup = MultiCatLegend({
      ...chartProps,
      offset,
      row,
    });
  }
  if (chartProps.i > 0) {
    return legendGroup;
  }
  let h = props.background.height;
  let w = props.width * chartProps.n;
  let xBounds = [
    chartProps.buckets[props.index],
    chartProps.buckets[props.index + 1],
  ];

  let xRange;
  if (chartProps.bounds.scale == "ordinal") {
    xRange = xBounds[0];
  } else {
    xRange = `${chartProps.xFormat(xBounds[0])}-${chartProps.xFormat(
      xBounds[1]
    )}`;
  }
  if (chartProps.valueType == "date") {
    xBounds = xBounds.map((bound) =>
      new Date(bound)
        .toISOString()
        .substring(0, 10)
        .replaceAll(/(-01-01|-01)$/g, "")
    );
  }

  let { x, ...counts } = props.payload;
  let count = 0;
  let series = [];
  Object.keys(counts).forEach((key, i) => {
    if (counts[key] > 0) {
      count += counts[key];
      series.push(
        <div key={key}>
          {key}: {counts[key]}
        </div>
      );
    }
  });

  return (
    <>
      <Tooltip
        title={<CellInfo x={xRange} count={count} rows={series} />}
        arrow
      >
        <Rectangle
          height={h}
          width={w}
          x={props.background.x}
          y={props.background.y}
          style={chartProps.embedded ? {} : { cursor: "pointer" }}
          fill={"rgba(255,255,255,0)"}
          onClick={
            chartProps.embedded
              ? () => {}
              : (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  searchByCell({
                    ...chartProps,
                    xBounds,
                  });
                }
          }
        />
      </Tooltip>
      {legendGroup}
    </>
  );
};

const Histogram = ({
  data,
  width,
  height,
  cats,
  endLabel,
  lastIndex,
  xLabel,
  yLabel,
  stacked,
  cumulative,
  chartProps,
  colors,
  legendRows,
}) => {
  let buckets = chartProps.buckets;
  let axes = [
    <CartesianGrid key={"grid"} strokeDasharray="3 3" vertical={false} />,
    <XAxis
      xAxisId={0}
      type="category"
      dataKey="x"
      key={"x"}
      angle={buckets.length > 15 ? -90 : 0}
      tickLine={false}
      tick={(props) =>
        renderXTick({
          ...props,
          endLabel,
          lastIndex: lastIndex,
          chartWidth: width,
          scale: chartProps.bounds.scale,
          showTickLabels: chartProps.showTickLabels,
          translations: chartProps.translations,
        })
      }
      tickFormatter={chartProps.showXTickLabels ? chartProps.xFormat : () => ""}
      interval={0}
      style={{ textAnchor: buckets.length > 15 ? "end" : "auto" }}
    >
      <Label
        value={xLabel}
        offset={buckets.length > 15 ? 10 : 0}
        position="bottom"
        fill="#666"
      />
    </XAxis>,
    <XAxis
      xAxisId={1}
      type="category"
      interval={0}
      dataKey="x"
      key={"hidden-x"}
      hide={true}
    ></XAxis>,
    <YAxis allowDecimals={false} key={"y"}>
      {width > 300 && (
        <Label
          value={yLabel}
          offset={-10}
          position="left"
          fill="#666"
          angle={-90}
          style={{ textAnchor: "middle" }}
        />
      )}
    </YAxis>,
  ];

  return (
    <BarChart
      width={width}
      height={height}
      barGap={0}
      barCategoryGap={0}
      data={data}
      margin={{
        top: legendRows ? legendRows * 35 + 5 : 5,
        right: 30,
        left: 20,
        bottom: width > 300 ? 25 : 5,
      }}
    >
      {axes}
      {cats.map((cat, i) => (
        <Bar
          dataKey={cat}
          key={cat}
          xAxisId={1}
          legendType={"none"}
          isAnimationActive={false}
          shape={
            <CustomBackground
              chartProps={{
                ...chartProps,
                width: width - 45,
                x: 10,
                name: cat,
                fill: colors[i] || "rgb(102, 102, 102)",
                i,
                stats: chartProps.stats[cat],
              }}
            />
          }
        />
      ))}
      {cats.map((cat, i) => (
        <Bar
          dataKey={cat}
          key={i}
          stackId={stacked ? 1 : false}
          fill={colors[i] || "rgb(102, 102, 102)"}
          isAnimationActive={false}
          style={{ pointerEvents: "none" }}
        />
      ))}
    </BarChart>
  );
};

const scales = {
  linear: (value, total) => value,
  sqrt: (value, total) => formats(Math.sqrt(value), "float"),
  log10: (value, total) =>
    value > 0 ? formats(Math.log10(value), "float") : 0,
  proportion: (value, total) =>
    total > 0 ? formats(value / total, "float") : 0,
};

const ReportHistogram = ({
  histogram,
  chartRef,
  containerRef,
  embedded,
  ratio,
  stacked,
  cumulative,
  yScale = "linear",
  setMessage,
  colors,
  levels,
  minDim,
  setMinDim,
  xOpts,
  basename,
}) => {
  const navigate = useNavigate();
  const componentRef = chartRef ? chartRef : useRef();
  const { width, height } = containerRef
    ? useResize(containerRef)
    : useResize(componentRef);
  useEffect(() => {
    if (histogram && histogram.status) {
      setMessage(null);
    }
  }, [histogram]);
  if (histogram && histogram.status) {
    let chartData = [];
    let chart;
    let { histograms, bounds } = histogram.report.histogram;
    if (!histograms) {
      return null;
    }
    let xOptions = (xOpts || "").split(";");
    if (xOptions.length == 1) {
      xOptions = xOptions[0].split(",");
    }
    let xLabel = xOptions[4] || histogram.report.xLabel;
    let yLabel = histogram.report.yLabel;
    let valueType = histograms.valueType;
    if (yScale == "log10") {
      yLabel = `Log10 ${yLabel}`;
    } else if (yScale == "proportion") {
      yLabel = `Proportional ${yLabel}`;
    }
    let cats;
    let lastIndex = histograms.buckets.length - 2;
    let interval;
    if (valueType == "date") {
      let start = histograms.buckets[0];
      let end = histograms.buckets[lastIndex + 1];
      let diff = end - start;
      interval = setInterval(diff, lastIndex);
    }
    let endLabel = formats(
      histograms.buckets[lastIndex + 1],
      valueType,
      interval
    );
    let stats = {};
    if (histograms.byCat) {
      cats = histogram.report.histogram.cats.map((cat) => cat.label);
      let sums = {};
      histograms.buckets.forEach((bucket, i) => {
        if (i < histograms.buckets.length - 1) {
          let series = {};
          histogram.report.histogram.cats.forEach((cat) => {
            if (!stats[cat.label]) {
              stats[cat.label] = {
                sum: 0,
                min: Number.POSITIVE_INFINITY,
                max: Number.NEGATIVE_INFINITY,
              };
            }
            let value = histograms.byCat[cat.key][i];
            if (value > 0) {
              stats[cat.label].sum += value;
              stats[cat.label].min = Math.min(stats[cat.label].min, value);
              stats[cat.label].max = Math.max(stats[cat.label].max, value);
            }
            if (cumulative) {
              if (!sums[cat.key]) {
                sums[cat.key] = 0;
              }
              value += sums[cat.key];
              sums[cat.key] = value;
            }

            series[cat.label] = scales[yScale](
              value,
              stacked ? histogram.report.histogram.x : cat.doc_count
            );
          });
          chartData.push({
            x: formats(bucket, valueType, interval),
            ...series,
          });
        }
      });
    } else {
      cats = ["all taxa"];
      stats["all taxa"] = {
        sum: 0,
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
      };
      let sum = 0;
      histograms.buckets.forEach((bucket, i) => {
        if (i < histograms.buckets.length - 1) {
          let value = histograms.allValues[i];
          if (value > 0) {
            stats["all taxa"].sum += value;
            stats["all taxa"].min = Math.min(stats["all taxa"].min, value);
            stats["all taxa"].max = Math.max(stats["all taxa"].max, value);
          }

          if (cumulative) {
            value += sum;
            sum = value;
          }
          chartData.push({
            x: formats(bucket, valueType),
            "all taxa": scales[yScale](value, histogram.report.histogram.x),
          });
        }
      });
    }
    const { translations, catTranslations, catOffsets, legendRows } =
      processLegendData({ bounds, width });
    if (cats && cats.length > 1 && levels[cats.length]) {
      colors = levels[cats.length];
    }
    chart = (
      <Histogram
        data={chartData}
        width={width}
        height={minDim - 50}
        cats={cats}
        xLabel={xLabel}
        yLabel={yLabel}
        endLabel={endLabel}
        lastIndex={lastIndex}
        stacked={stacked}
        colors={colors}
        legendRows={legendRows}
        chartProps={{
          zDomain: histograms.zDomain,
          xLength: histograms.buckets.length - 1,
          n: cats.length,
          yScale: yScale,
          xQuery: histogram.report.xQuery,
          xLabel,
          bounds,
          fields: histograms.fields,
          showTickLabels: xOptions[2]
            ? xOptions[2] >= 0
              ? true
              : false
            : true,
          ranks: histograms.ranks,
          stats,
          buckets: histograms.buckets,
          translations,
          catTranslations,
          catOffsets,
          xFormat: (value) => formats(value, valueType),
          valueType,
          embedded,
          navigate,
          location,
          basename,
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
  withColors
)(ReportHistogram);
