import MultiCatLegend, { processLegendData } from "./MultiCatLegend";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import formats, { setInterval } from "../functions/formats";
import stringLength, { maxStringLength } from "../functions/stringLength";
import { useLocation, useNavigate } from "@reach/router";

import Grid from "@mui/material/Grid2";
import PointInfo from "./PointInfo";
import Tooltip from "./Tooltip";
import { compose } from "recompose";
import { path as d3Path } from "d3-path";
import dispatchMessage from "../hocs/dispatchMessage";
import { fadeColor } from "../functions/fadeColor";
import qs from "../functions/qs";
import { scaleLinear } from "d3-scale";
import setColors from "../functions/setColors";
import truncate from "../functions/truncate";
import { useLongPress } from "use-long-press";
import useResize from "../hooks/useResize";
import withColors from "../hocs/withColors";
import withReportTerm from "../hocs/withReportTerm";
import withSiteName from "../hocs/withSiteName";

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

  navigate(
    `${basename}/search?${queryString.replace(/^\?/, "")}#${encodeURIComponent(
      pointQuery,
    )}`,
  );
};

const STROKE_WIDTH = 5;

const Ribbon = ({
  pointData,
  width,
  height,
  buckets,
  yBuckets,
  colors,
  cats,
  chartProps,
  basename,
  marginWidth,
  marginHeight,
  marginRight,
  marginTop,
  dropShadow = false,
}) => {
  const [currentSeries, setCurrentSeries] = useState(false);
  const [visible, setVisible] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const handleLabelClick = (label) => {
    let newVisible = { ...visible };
    if (visible[label]) {
      delete newVisible[label];
    } else {
      newVisible[label] = true;
    }
    setVisible(newVisible);
  };
  const searchBySequence = (label) => {
    let liveSeqs = new Set([label]);
    pointData.forEach((arr, i) => {
      arr.forEach((point) => {
        if (point.sequenceId == label) {
          liveSeqs.add(point.ySequenceId);
        } else if (point.ySequenceId == label) {
          liveSeqs.add(point.sequenceId);
        }
      });
    });
    let { search } = location;

    let { x, query = x } = search;
    let options = qs.parse(search.replace(/^\?/, ""));
    let queryParts = options.query
      .split(" AND ")
      .filter((part) => !part.startsWith("sequence_id"));
    let newQuery =
      queryParts.join(" AND ") +
      ` AND sequence_id=${Array.from(liveSeqs).join(",")}`;

    let queryString = qs.stringify({
      ...options,
      query: newQuery,
    });

    navigate(
      `${basename}/search?${queryString.replace(/^\?/, "")}#${encodeURIComponent(
        newQuery,
      )}`,
    );
  };

  const longPressCallback = useCallback((e, value) => {
    e.preventDefault();
    e.stopPropagation();
    searchBySequence(value.context);
  }, []);

  const longPress = useLongPress(longPressCallback, {
    onStart: (e) => e.preventDefault(),
    onCancel: (e, value) => {
      handleLabelClick(value.context);
    },
    captureEvent: true,
    threshold: 500,
  });

  let fillColors = colors.map((hex, i) =>
    fadeColor({ hex, i, active: currentSeries }),
  );
  let labelHeight = 20;
  let padding = labelHeight / 2;
  let { labels, yLabels } = chartProps;
  let dataWidth = width - Math.max(labels.length, yLabels.length) * labelHeight;
  if (dataWidth < 50) {
    return null;
  }

  let maxSpan = Math.max(
    buckets[buckets.length - 1] - buckets[0],
    yBuckets[yBuckets.length - 1] - yBuckets[0],
  );

  let division = Math.ceil(Math.log10(maxSpan));
  let step = Math.pow(10, division - 2);
  while (maxSpan / step < 50) {
    step /= 2;
  }

  const generateSteppedScale = ({ buckets, labels, padding, width }) => {
    let span = buckets[buckets.length - 1] - buckets[0];
    let dataWidth = width - labels.length * padding * 2;
    let left = padding;
    let scales = {};
    labels.forEach((label, i) => {
      let right = left + ((buckets[i + 1] - buckets[i]) / span) * dataWidth;
      let xScale = scaleLinear()
        .domain([buckets[i], buckets[i + 1]])
        .range([left, right]);
      left = right + padding * 2;
      scales[label] = xScale;
    });
    return scales;
  };
  // let xScale = scaleLinear()
  //   .domain([0, buckets[buckets.length - 1]])
  //   .range([0, width - labels.length * labelHeight]);
  let xScales = generateSteppedScale({
    buckets,
    labels,
    padding,
    width,
  });
  let yScales = generateSteppedScale({
    buckets: yBuckets,
    labels: yLabels,
    padding,
    width,
  });
  // let yScale = scaleLinear()
  //   .domain([0, yBuckets[yBuckets.length - 1]])
  //   .range([0, height - yLabels.length * labelHeight]);
  let topCoord = marginTop + padding;
  let bottomCoord = height - marginHeight - padding;
  const setChrs = ({ scales, labels, buckets, padding }) => {
    let chrs = [];
    labels.forEach((label, i) => {
      let x1 = scales[label]([buckets[i]]);
      let x2 = scales[label]([buckets[i + 1]]);
      let labelLength = stringLength(label);
      let formattedLabel = label;
      if ((labelLength - 2) * padding > x2 - x1) {
        formattedLabel = truncate(label, Math.floor((x2 - x1) / padding));
      }
      let stroke = visible[label] ? "white" : "#31323f";
      let fill = visible[label] ? "#31323f" : "white";
      let lines = [];
      for (let n = 0; n < buckets[i + 1] - buckets[i]; n += step) {
        let x = scales[label]([buckets[i] + n]);
        lines.push(
          <line
            key={n}
            x1={x}
            y1={0}
            x2={x}
            y2={padding * 2}
            stroke={stroke}
            strokeWidth={2}
            strokeDasharray={`${padding / 4} ${padding * 1.5}`}
          />,
        );
      }
      chrs.push(
        <Tooltip
          title={`${label} (${formats(buckets[i + 1] - buckets[i], "integer")}bp)`}
          arrow
          key={label}
          enterDelay={500}
        >
          <g
            key={label}
            // onClick={() => {
            //   searchBySequence(label);
            //   handleLabelClick(label);
            // }}
            {...longPress(label)}
            style={{ cursor: "pointer" }}
          >
            <rect
              x={x1 - padding}
              y={0}
              width={x2 - x1 + padding * 2}
              height={padding * 2}
              fill={fill}
              stroke={visible[label] ? fill : stroke}
              strokeWidth={2}
              rx={padding}
            />
            {lines}
            <text
              x={(x1 + x2) / 2}
              key={label}
              y={padding}
              textAnchor="middle"
              fontSize={padding}
              dominantBaseline="middle"
              alignmentBaseline="middle"
              fill={stroke}
            >
              {formattedLabel}
            </text>
          </g>
        </Tooltip>,
      );
    });
    return chrs;
  };
  let xChrs = setChrs({ scales: xScales, labels, buckets, padding });
  let yChrs = setChrs({
    scales: yScales,
    labels: yLabels,
    buckets: yBuckets,
    padding,
  });

  let groups = [];
  let legend = [];
  let current = [];
  let clipRect = (
    <clipPath id="clipRect">
      <rect x={0} y={topCoord} width={width} height={bottomCoord - topCoord} />
    </clipPath>
  );
  pointData.forEach((arr, i) => {
    if (arr.length > 0) {
      let handleClick;
      if (cats.length > 1) {
        handleClick = (i) => {
          currentSeries !== false && currentSeries == i
            ? setCurrentSeries(false)
            : setCurrentSeries(i);
        };
      }
      let offset, row;
      if (chartProps.catOffsets[cats[i]]) {
        ({ offset, row } = chartProps.catOffsets[cats[i]]);
      }
      let legendProps = {
        ...chartProps,
        width: width - 45,
        x: 10,
        name: cats[i],
        fill: colors[i],
        i,
        stats: cats[i],
      };
      legend.push(
        MultiCatLegend({
          ...legendProps,
          offset,
          row,
          handleClick,
          active: currentSeries === i,
        }),
      );
    }
    // dropShadow = currentSeries !== false && currentSeries == i;
    arr.forEach((point, j) => {
      if (
        Object.keys(visible).length == 0 ||
        visible[point.sequenceId] ||
        visible[point.ySequenceId]
      ) {
        let x = xScales[point.sequenceId](point.x);
        let y = yScales[point.ySequenceId](point.y);
        const path = d3Path();
        path.moveTo(x, bottomCoord);
        path.bezierCurveTo(
          x,
          bottomCoord + (topCoord - bottomCoord) * 0.25,
          y,
          bottomCoord + (topCoord - bottomCoord) * 0.75,
          y,
          topCoord,
        );
        // path.moveTo(x, height);
        // path.bezierCurveTo(x, y * 0.95, x * 0.05, y, 0, y);
        // let path = `M${x},0L${y},${height}`;
        let pathSvg = (
          <Tooltip
            title={
              <PointInfo {...point} chartProps={chartProps} fill={colors[i]} />
            }
            arrow
            followCursor={true}
            key={`${i}-${j}`}
          >
            <path
              fill="none"
              stroke={fillColors[i]}
              strokeWidth={STROKE_WIDTH}
              onClick={() =>
                searchByPoint({
                  props: {
                    ...point,
                    payload: { x: point.sequenceId, y: point.ySequenceId },
                  },
                  chartProps,
                })
              }
              style={{
                cursor: "pointer",
                ...(dropShadow && { filter: "URL(#shadow)" }),
              }}
              d={path}
            />
          </Tooltip>
        );
        if (currentSeries !== false && currentSeries == i) {
          current.push(pathSvg);
        } else {
          groups.push(pathSvg);
        }
      }
    });
    //
  });
  return (
    <svg
      preserveAspectRatio="xMinYMin meet"
      height={height}
      width={width}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <filter id="shadow">
          <feDropShadow
            dx={STROKE_WIDTH / 2}
            dy={STROKE_WIDTH / 2}
            stdDeviation={STROKE_WIDTH}
            floodOpacity={0.75}
            floodColor="#31323f"
          />
        </filter>
        {clipRect}
      </defs>
      <g id="ribbons">
        <g
          style={{ ...(currentSeries !== false && { pointerEvents: "none" }) }}
        >
          {groups}
        </g>
        <g clipPath="url(#clipRect)">{current}</g>
      </g>
      <g transform={`translate(0,${bottomCoord - 10})`}>{xChrs}</g>
      <g transform={`translate(0,${topCoord - 10})`}>{yChrs}</g>
      <g>{legend}</g>
    </svg>
  );
};

const ReportFlatter = ({
  scatter,
  chartRef,
  report,
  containerRef,
  embedded,
  inModal,
  compactLegend,
  compactWidth = 400,
  ratio,
  zScale = "linear",
  message,
  setMessage,
  reportSelect,
  reportTerm,
  colors,
  levels,
  colorPalette,
  palettes,
  minDim,
  setMinDim,
  xOpts,
  yOpts,
  reversed,
  stacked,
  highlightArea,
  basename,
  pointSize = 15,
}) => {
  pointSize *= 1;
  const navigate = useNavigate();
  const location = useLocation();
  const [highlight, setHighlight] = useState([]);
  const componentRef = chartRef || useRef();
  const { width, height } = containerRef
    ? useResize(containerRef)
    : useResize(componentRef);
  useEffect(() => {
    if (inModal && message && scatter && scatter.status) {
      setMessage(null);
    }
  }, [scatter]);

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
    let yOptions = (yOpts || "").replace("nsort", "").split(";");
    if (yOptions.length == 1) {
      yOptions = yOptions[0].split(",");
    }
    let xLabel = xOptions[4] || scatter.report.xLabel;
    let yLabel = yOptions[4] || scatter.report.yLabel;
    let {
      valueType,
      summary,
      yValueType = "integer",
      ySummary = "value",
    } = heatmaps;
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
      interval,
    );
    compactLegend =
      typeof compactLegend !== "undefined"
        ? compactLegend
        : typeof embedded === "undefined" || plotWidth < compactWidth;

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
    const yFormat = (value) => formats(value, yValueType, yInterval);

    let labels = bounds.labels || heatmaps.buckets;
    let yLabels = yBounds.labels || heatmaps.yBuckets;
    let showLabels = plotWidth >= compactWidth;
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
      (plotWidth - marginWidth - marginRight) / heatmaps.buckets.length
    ) {
      orientation = -90;
      marginHeight =
        maxXLabel + pointSize > 20 ? maxXLabel + pointSize - 20 : 0;
    }
    let marginTop = 5;
    if (legendRows) {
      if (compactLegend) {
        marginTop += legendRows * (pointSize + 10);
      } else {
        marginTop += legendRows * (2 * pointSize + 15);
      }
    }
    chart = (
      <Ribbon
        pointData={pointData}
        width={plotWidth}
        height={plotHeight}
        buckets={heatmaps.buckets}
        yBuckets={heatmaps.yBuckets}
        marginWidth={marginWidth}
        marginHeight={marginHeight}
        marginRight={marginRight}
        marginTop={marginTop}
        colors={colors}
        cats={cats}
        legendRows={legendRows}
        basename={basename}
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
          showXTickLabels: xOptions[2] ? xOptions[2] >= 0 : true,
          showYTickLabels: yOptions[2] ? yOptions[2] >= 0 : true,
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
    // chart = (
    //   <Heatmap
    //     data={chartData}
    //     pointData={1 ? pointData : []}
    //     width={plotWidth}
    //     height={plotHeight}
    //     marginWidth={marginWidth}
    //     marginHeight={marginHeight}
    //     marginRight={marginRight}
    //     buckets={heatmaps.buckets}
    //     yBuckets={heatmaps.yBuckets}
    //     yOrientation={heatmaps.yOrientation}
    //     labels={labels}
    //     yLabels={yLabels}
    //     cats={cats}
    //     xLabel={xLabel}
    //     yLabel={yLabel}
    //     endLabel={endLabel}
    //     lastIndex={lastIndex}
    //     highlight={highlight}
    //     highlightArea={highlightArea}
    //     colors={colors}
    //     reversed={reversed}
    //     legendRows={legendRows}
    //     chartProps={{
    //       zDomain: heatmaps.zDomain,
    //       yLength: heatmaps.yBuckets.length - 1,
    //       xLength: heatmaps.buckets.length - 1,
    //       n: cats.length,
    //       zScale: zScale,
    //       report,
    //       catSums,
    //       pointSize,
    //       pointRatio: scatter.report.oxford ? 0.5 : 1,
    //       groupBy,
    //       selectMode: reportSelect,
    //       xQuery: scatter.report.xQuery,
    //       yQuery: scatter.report.yQuery,
    //       maxYLabel,
    //       maxXLabel,
    //       xLabel: scatter.report.xLabel,
    //       yLabel: scatter.report.yLabel,
    //       showXTickLabels: xOptions[2] ? xOptions[2] >= 0 : true,
    //       showYTickLabels: yOptions[2] ? yOptions[2] >= 0 : true,
    //       xFormat,
    //       yFormat,
    //       orientation,
    //       fields: heatmaps.fields,
    //       ranks: heatmaps.ranks,
    //       bounds,
    //       yBounds,
    //       translations,
    //       yTranslations,
    //       catTranslations,
    //       catOffsets,
    //       buckets: heatmaps.buckets,
    //       yBuckets: heatmaps.yBuckets,
    //       labels,
    //       yLabels,
    //       showLabels,
    //       valueType,
    //       yValueType,
    //       summary,
    //       ySummary,
    //       stacked,
    //       hasRawData,
    //       embedded,
    //       navigate,
    //       location,
    //       basename,
    //       compactLegend,
    //     }}
    //   />
    // );
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
  memo,
  withSiteName,
  dispatchMessage,
  withColors,
  withReportTerm,
)(ReportFlatter);
