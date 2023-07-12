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
import stringLength, { maxStringLength } from "../functions/stringLength";
import { useLocation, useNavigate } from "@reach/router";

import CellInfo from "./CellInfo";
import Grid from "@material-ui/core/Grid";
import ReportXAxisTick from "./ReportXAxisTick";
import Tooltip from "@material-ui/core/Tooltip";
import axisScales from "../functions/axisScales";
import { compose } from "recompose";
import dispatchMessage from "../hocs/dispatchMessage";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import useResize from "../hooks/useResize";
import withColors from "../hocs/withColors";
import withSearchIndex from "../hocs/withSearchIndex";
import withSiteName from "../hocs/withSiteName";

const searchByCell = ({
  xQuery,
  summary,
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

  if (bounds.scale == "ordinal" && field == bounds.field) {
    query += ` AND ${field} = ${xBounds[0]}`;
  } else {
    query += ` AND ${field} >= ${xBounds[0]} AND ${field} < ${xBounds[1]}`;
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
      count += counts[key] * 1;
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
  marginWidth,
  marginHeight,
  marginRight,
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
  let yDomain = [0, "dataMax"];
  if (chartProps.yScale == "proportion") {
    yDomain = [0, 1];
  } else if (chartProps.yScale.startsWith("log")) {
    yDomain = [1, "dataMax"];
  }
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
      // tick={(props) =>
      //   renderXTick({
      //     ...props,
      //     endLabel,
      //     lastIndex: lastIndex,
      //     chartWidth: width,
      //     scale: chartProps.bounds.scale,
      //     showTickLabels: chartProps.showTickLabels,
      //     translations: chartProps.translations,
      //   })
      // }
      ticks={isNaN(buckets[0]) ? null : buckets}
      tick={(props) =>
        ReportXAxisTick({
          props,
          buckets,
          fmt: chartProps.xFormat,
          translations: chartProps.translations,
          pointSize: chartProps.pointSize,
          orientation: chartProps.orientation,
          lastPos: width - marginRight,
          showLabels: chartProps.showLabels,
          report: isNaN(buckets[0]) ? "catHistogram" : "histogram",
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
    <YAxis
      allowDecimals={chartProps.yScale == "proportion"}
      domain={yDomain}
      key={"y"}
      style={{
        fontSize: chartProps.showLabels ? chartProps.pointSize : 0,
      }}
      tickFormatter={
        chartProps.yScale == "proportion" ? (v) => v : chartProps.yFormat
      }
    >
      {width > 300 && (
        <Label
          value={yLabel}
          offset={marginWidth + 60 - chartProps.pointSize}
          position="insideRight"
          fill="#666"
          angle={-90}
          style={{ textAnchor: "middle" }}
          fontSize={chartProps.pointSize}
          fontWeight="bold"
        />
      )}
    </YAxis>,
  ];

  let marginTop = 5;
  if (legendRows) {
    if (chartProps.compactLegend) {
      marginTop += legendRows * (chartProps.pointSize + 10);
    } else {
      marginTop += legendRows * (2 * chartProps.pointSize + 15);
    }
  }

  return (
    <BarChart
      width={width}
      height={height}
      barGap={0}
      barCategoryGap={0}
      data={data}
      // margin={{
      //   top: legendRows ? legendRows * 35 + 5 : 5,
      //   right: 30,
      //   left: 20,
      //   bottom: width > 300 ? 25 : 5,
      // }}
      margin={{
        top: marginTop,
        right: marginRight,
        left: marginWidth,
        bottom: width > 300 ? marginHeight : 5,
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
      {cats.map((cat, i) => {
        return (
          <Bar
            dataKey={cat}
            key={i}
            stackId={stacked ? 1 : false}
            fill={colors[i] || "rgb(102, 102, 102)"}
            isAnimationActive={false}
            style={{ pointerEvents: "none" }}
          />
        );
      })}
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
  searchIndexPlural,
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
  pointSize = 15,
  compactLegend,
  compactWidth = 600,
}) => {
  pointSize *= 1;
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
    let buckets = histograms.buckets;
    let valueType = histograms.valueType;
    let summary = histograms.summary;
    let compressX;
    if (
      histograms.byCat &&
      buckets.length == 2 &&
      stacked &&
      yScale != "proportion"
    ) {
      buckets = histogram.report.histogram.cats.map((cat) => cat.label);
      valueType = "keyword";
      compressX = true;
    }
    let xLabel = xOptions[4] || histogram.report.xLabel;
    let yLabel = histogram.report.yLabel;
    if (yScale == "log10") {
      yLabel = `Log10 ${yLabel}`;
    } else if (yScale == "proportion") {
      yLabel = `Proportional ${yLabel}`;
    }
    let cats;
    let lastIndex = buckets.length - 2;
    let interval;
    if (valueType == "date") {
      let start = buckets[0];
      let end = buckets[lastIndex + 1];
      let diff = end - start;
      interval = setInterval(diff, lastIndex);
    }
    let endLabel = formats(buckets[lastIndex + 1], valueType, interval);
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
          if (compressX) {
            for (let [key, value] of Object.entries(series)) {
              chartData.push({
                x: key,
                [key]: value,
              });
            }
          } else {
            chartData.push({
              x: bucket,
              ...series,
            });
          }
        }
      });
    } else {
      cats = [`all ${searchIndexPlural}`];
      stats[`all ${searchIndexPlural}`] = {
        sum: 0,
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
      };
      let sum = 0;
      buckets.forEach((bucket, i) => {
        if (i < buckets.length - 1) {
          let value = histograms.allValues[i];
          if (value > 0) {
            stats[`all ${searchIndexPlural}`].sum += value;
            stats[`all ${searchIndexPlural}`].min = Math.min(
              stats[`all ${searchIndexPlural}`].min,
              value
            );
            stats[`all ${searchIndexPlural}`].max = Math.max(
              stats[`all ${searchIndexPlural}`].max,
              value
            );
          }

          if (cumulative) {
            value += sum;
            sum = value;
          }
          chartData.push({
            x: bucket,
            [`all ${searchIndexPlural}`]: scales[yScale](
              value,
              histogram.report.histogram.x
            ),
          });
        }
      });
    }
    compactLegend =
      typeof compactLegend !== "undefined"
        ? compactLegend
        : typeof embedded === "undefined" || width < compactWidth;
    const { translations, catTranslations, catOffsets, legendRows } =
      processLegendData({
        bounds,
        minWidth: compactLegend ? 50 : 10 * pointSize,
        width,
        pointSize,
      });
    if (cats && cats.length > 1 && levels[cats.length]) {
      colors = levels[cats.length];
    }
    const xFormat = (value) => formats(value, valueType, interval);
    const yFormat = (value) => formats(value, "integer");
    let showLabels = width >= compactWidth;
    const maxYLabel = showLabels
      ? maxStringLength(histograms.zDomain, yFormat, pointSize)
      : 0;
    const marginWidth =
      maxYLabel * 1 + pointSize > 40 ? maxYLabel * 1 + pointSize - 40 : 0;
    const maxXLabel = showLabels
      ? maxStringLength(histograms.buckets, xFormat, pointSize)
      : 0;
    let marginHeight = 2 * pointSize;
    const marginRight = showLabels
      ? (stringLength(xFormat(endLabel)) * pointSize) / 2
      : 0;
    let orientation = 0;

    if (maxXLabel > (width - marginWidth - marginRight) / buckets.length) {
      orientation = -90;
      marginHeight =
        maxXLabel + pointSize > 20 ? maxXLabel + pointSize - 20 : 0;
    }
    chart = (
      <Histogram
        data={chartData}
        width={width}
        height={minDim - (showLabels ? 50 : 0)}
        marginWidth={marginWidth}
        marginHeight={marginHeight}
        marginRight={marginRight}
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
          // showTickLabels: xOptions[2]
          //   ? xOptions[2] >= 0
          //     ? true
          //     : false
          //   : true,
          showtickLabels: true,
          ranks: histograms.ranks,
          stats,
          buckets,
          translations,
          catTranslations,
          catOffsets,
          xFormat,
          yFormat,
          orientation,
          pointSize,
          valueType,
          summary,
          embedded,
          navigate,
          location,
          basename,
          compactLegend,
          showLabels,
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
  withSearchIndex
)(ReportHistogram);
