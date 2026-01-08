import { Bar, BarChart, CartesianGrid, Label, XAxis, YAxis } from "recharts";
import MultiCatLegend, { processLegendData } from "./MultiCatLegend";
import React, { useEffect, useRef } from "react";
import formats, { setInterval } from "../functions/formats";
import stringLength, { maxStringLength } from "../functions/stringLength";

import CellInfo from "./CellInfo";
import Grid from "@mui/material/Grid2";
import ReportXAxisTick from "./ReportXAxisTick";
import Tooltip from "./Tooltip";
import { active as activeStyle } from "./Styles.scss";
import { compose } from "redux";
import dispatchMessage from "../hocs/dispatchMessage";
import searchByCell from "../functions/searchByCell";
import setColors from "../functions/setColors";
import { ttSwatch as ttSwatchStyle } from "./Styles.scss";
import { useNavigate } from "@reach/router";
import useResize from "../hooks/useResize";
import withColors from "#hocs/withColors";
import withSearchIndex from "../hocs/withSearchIndex";
import withSiteName from "#hocs/withSiteName";
import withTheme from "#hocs/withTheme";

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
  let xRange = [
    chartProps.buckets[props.index],
    chartProps.buckets[props.index + 1],
  ];

  let xLimits;
  if (chartProps.bounds.scale == "ordinal") {
    xLimits = xRange[0];
  } else {
    xLimits = `${chartProps.xFormat(xRange[0])}-${chartProps.xFormat(
      xRange[1],
    )}`;
  }
  if (chartProps.valueType == "date") {
    xRange = xRange.map((bound) =>
      new Date(bound)
        .toISOString()
        .substring(0, 10)
        .replaceAll(/(-01-01|-01)$/g, ""),
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
          <span
            className={ttSwatchStyle}
            style={{
              backgroundColor: chartProps.colors[i],
            }}
          />
          {key}: {counts[key]}
        </div>,
      );
    }
  });
  let { highlightColor } = chartProps.colorScheme;
  let CurrentRect = React.forwardRef((refProps, ref) => (
    <rect
      ref={ref}
      {...refProps}
      className={activeStyle}
      height={h}
      width={w}
      x={props.background.x}
      y={props.background.y}
      style={chartProps.embedded ? {} : { cursor: "pointer" }}
      fill={highlightColor}
      fillOpacity={0}
      onClick={
        chartProps.embedded
          ? () => {}
          : (e) => {
              e.preventDefault();
              e.stopPropagation();
              searchByCell({
                ...chartProps,
                xRange,
              });
            }
      }
    />
  ));

  return (
    <>
      <Tooltip
        disableInteractive={false}
        title={<CellInfo x={xLimits} count={count} rows={series} />}
        arrow
      >
        <CurrentRect />
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
  legendRows,
}) => {
  let yDomain = [0, "dataMax"];
  if (chartProps.yScale == "proportion") {
    yDomain = [0, 1];
  } else if (chartProps.yScale.startsWith("log")) {
    yDomain = [1, "dataMax"];
  }
  let { buckets, axisColor } = chartProps;

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
      ticks={Number.isNaN(buckets[0]) ? null : buckets}
      tick={(props) =>
        ReportXAxisTick({
          props: { ...props, fill: axisColor },
          buckets,
          fmt: chartProps.xFormat,
          translations: chartProps.translations,
          pointSize: chartProps.pointSize,
          orientation: chartProps.orientation,
          // lastPos: width - marginRight,
          labels: chartProps.labels,
          showLabels: chartProps.showLabels,
          valueType: chartProps.valueType,
          report: Number.isNaN(buckets[0]) ? "catHistogram" : "histogram",
        })
      }
      tickFormatter={chartProps.showXTickLabels ? chartProps.xFormat : () => ""}
      interval={0}
      style={{ textAnchor: buckets.length > 15 ? "end" : "auto" }}
      axisLine={{ stroke: axisColor }}
      // tickLine={{ stroke: axisColor }}
    >
      <Label
        value={xLabel}
        // offset={buckets.length > 15 ? chartProps.pointSize + 10 : 10}
        offset={marginHeight - chartProps.pointSize}
        dy={0}
        position="bottom"
        dominantBaseline={"text-after-edge"}
        fill={axisColor}
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
        fill: axisColor,
      }}
      tickFormatter={
        chartProps.yScale == "proportion" ? (v) => v : chartProps.yFormat
      }
      axisLine={{ stroke: axisColor }}
      tickLine={{ stroke: axisColor }}
    >
      {width > 300 && (
        <Label
          value={yLabel}
          offset={marginWidth + 60 - chartProps.pointSize}
          position="insideRight"
          fill={axisColor}
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
      {cats.map((cat, i) => {
        return (
          <Bar
            dataKey={cat}
            key={i}
            stackId={stacked ? 1 : false}
            fill={chartProps.colors[i] || "rgb(102, 102, 102)"}
            isAnimationActive={false}
            style={{ pointerEvents: "none" }}
          />
        );
      })}
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
                fill: chartProps.colors[i] || "rgb(102, 102, 102)",
                i,
                stats: chartProps.stats[cat],
              }}
            />
          }
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
  inModal,
  searchIndexPlural,
  ratio = 1,
  stacked,
  cumulative,
  yScale = "linear",
  message,
  setMessage,
  colors,
  levels,
  colorPalette,
  palettes,
  colorScheme,
  theme,
  minDim,
  setMinDim,
  xOpts,
  basename,
  pointSize = 15,
  compactLegend,
  compactWidth = 400,
}) => {
  pointSize *= 1;
  const navigate = useNavigate();
  const componentRef = chartRef || useRef();
  const { width, height } = containerRef
    ? useResize(containerRef)
    : useResize(componentRef);
  useEffect(() => {
    if (inModal && message && histogram && histogram.status) {
      setMessage(null);
    }
  }, [histogram]);

  // let { plotWidth, plotHeight } = setDimensions({ width, height });

  // useEffect(() => {
  //   ({ plotWidth, plotHeight } = setDimensions({ width, height }));
  // }, [width]);

  const setDimensions = ({ width, height, timer }) => {
    let plotWidth = width;
    let plotHeight = inModal ? height : plotWidth / ratio;

    if (timer && plotHeight != height) {
      dimensionTimer = setTimeout(() => {
        minDim = Math.min(plotWidth, plotHeight);
        setMinDim(minDim);
      }, 50);
    }
    return {
      plotWidth,
      plotHeight,
      dimensionTimer,
    };
  };

  let dimensionTimer;
  let { plotWidth, plotHeight } = setDimensions({ width, height });

  useEffect(() => {
    ({ plotWidth, plotHeight, dimensionTimer } = setDimensions({
      width,
      height,
      timer: true,
    }));
    return () => {
      clearTimeout(dimensionTimer);
    };
  }, [width]);

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
    let { buckets, valueType, summary } = histograms;
    let labels = bounds.labels || buckets;

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
    let { yLabel } = histogram.report;
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
              stacked ? histogram.report.histogram.x : cat.doc_count,
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
              value,
            );
            stats[`all ${searchIndexPlural}`].max = Math.max(
              stats[`all ${searchIndexPlural}`].max,
              value,
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
              histogram.report.histogram.x,
            ),
          });
        }
      });
    }
    compactLegend =
      typeof compactLegend !== "undefined"
        ? compactLegend
        : typeof embedded === "undefined" || plotWidth < compactWidth;
    const { translations, catTranslations, catOffsets, legendRows } =
      processLegendData({
        bounds,
        minWidth: compactLegend ? 50 : 10 * pointSize,
        width: plotWidth,
        pointSize,
        compactLegend,
      });
    ({ levels, colors } = setColors({
      colorPalette,
      palettes,
      levels,
      count: cats.length,
      colors,
    }));
    const xFormat = (value) => formats(value, valueType, interval);
    const yFormat = (value) => formats(value, "integer");
    let showLabels = plotWidth >= compactWidth;
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

    if (maxXLabel > (plotWidth - marginWidth - marginRight) / buckets.length) {
      orientation = -90;
      marginHeight =
        maxXLabel + pointSize > 20 ? maxXLabel + pointSize - 20 : 0;
    }
    chart = (
      <Histogram
        data={chartData}
        // width={width}
        // height={minDim - (showLabels ? 50 : 0)}
        width={plotWidth}
        height={plotHeight}
        marginWidth={marginWidth}
        marginHeight={marginHeight}
        marginRight={marginRight}
        cats={cats}
        xLabel={xLabel}
        yLabel={yLabel}
        endLabel={endLabel}
        lastIndex={lastIndex}
        stacked={stacked}
        legendRows={legendRows}
        chartProps={{
          zDomain: histograms.zDomain,
          xLength: histograms.buckets.length - 1,
          n: cats.length,
          yScale: yScale,
          xQuery: histogram.report.xQuery,
          xLabel,
          bounds,
          labels,
          colors,
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
          colorScheme: colorScheme[theme],
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
          axisColor: colorScheme[theme].darkColor,
        }}
      />
    );

    return (
      <Grid ref={componentRef} style={{ height: "100%" }} size="grow">
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
  withTheme,
  withColors,
  withSearchIndex,
)(ReportHistogram);
