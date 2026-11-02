import MultiCatLegend, { processLegendData } from "./MultiCatLegend";
import formats, { setInterval } from "#functions/formats";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import stringLength, { maxStringLength } from "#functions/stringLength";

import Grid from "@mui/material/Grid";
import Tooltip from "#wrappers/Tooltip";
import { compose } from "redux";
import dispatchMessage from "#hocs/dispatchMessage";
import { fadeColor } from "#functions/fadeColor";
import { pathRound } from "d3-path";
import qs from "#functions/qs";
import { scaleLinear } from "d3-scale";
import setColors from "#functions/setColors";
import truncate from "#functions/truncate";
import { useLocation } from "@reach/router";
import { useLongPress } from "use-long-press";
import useNavigate from "#hooks/useNavigate";
import useResize from "#hooks/useResize";
import withColors from "#hocs/withColors";
import withReportTerm from "#hocs/withReportTerm";
import withSiteName from "#hocs/withSiteName";

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
    `search?${queryString.replace(/^\?/, "")}#${encodeURIComponent(
      pointQuery,
    )}`,
  );
};

const parseHsl = (hsl) => {
  let [h = 0, s = 0, l = 0] = (hsl || "")
    .replace(/^hsl\(|\)$/g, "")
    .split(",")
    .map((v = 0) => parseFloat(v));
  return [h, s, l];
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const lerp = (a, b, t) => a + (b - a) * t;

const getRampColor = ({
  hsl,
  t,
  lightnessRange = 50,
  minClamp = 20,
  maxClamp = 80,
}) => {
  const [h, s, l] = parseHsl(hsl);
  let minLightness;
  let maxLightness;
  if (lightnessRange > maxClamp - minClamp) {
    lightnessRange = maxClamp - minClamp;
  }
  let halfRange = lightnessRange / 2;
  if (l - halfRange < minClamp) {
    minLightness = minClamp;
    maxLightness = minClamp + lightnessRange;
  } else if (l + halfRange > maxClamp) {
    minLightness = maxClamp - lightnessRange;
    maxLightness = maxClamp;
  } else {
    minLightness = l - halfRange;
    maxLightness = l + halfRange;
  }
  const lightness = lerp(maxLightness, minLightness, 1 - t); // 0 = light, 1 = dark
  const saturation = clamp(s + 8, 35, 100);

  return `hsl(${h} ${saturation}% ${lightness}%)`;
};

const labelKey = (row, label) => `${row}|${label}`;

// Scale for one assembly row. Each label bar is drawn with `pad` overflow on
// both sides, so the scale range is reduced by 2 * pad per label and the
// remaining width is shared between the label bars.
const generateSteppedScale = ({ buckets, labels, pad, width }) => {
  let span = buckets[buckets.length - 1] - buckets[0];
  let labelWidth = width - 2 - 2 * labels.length * pad;
  let left = pad + 1;
  let scales = {};
  labels.forEach((label, i) => {
    let right = left + ((buckets[i + 1] - buckets[i]) / span) * labelWidth;
    let xScale = scaleLinear()
      .domain([buckets[i], buckets[i + 1]])
      .range([left, right]);
    left = right + pad * 2;
    scales[label] = xScale;
  });
  return scales;
};

const Ribbon = ({
  links,
  assemblies,
  width,
  height,
  colors,
  cats,
  chartProps,
  marginHeight,
  marginTop,
  dropShadow,
  assemblyNames,
  showGutter,
  outerLabels,
}) => {
  const [currentSeries, setCurrentSeries] = useState(false);
  const [visible, setVisible] = useState({});
  const [expandedLabel, setExpandedLabel] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const handleLabelClick = (key) => {
    let newVisible = { ...visible };
    if (visible[key]) {
      delete newVisible[key];
    } else {
      newVisible[key] = true;
    }
    setVisible(newVisible);
  };
  const searchBySequence = ({ row, label }) => {
    let liveSeqs = new Set([label]);
    links.forEach((link) => {
      if (link.asm1 == row && link.sequenceId == label) {
        liveSeqs.add(link.ySequenceId);
      } else if (link.asm2 == row && link.ySequenceId == label) {
        liveSeqs.add(link.sequenceId);
      }
    });
    let { search } = location;

    let { x, query = x } = search;
    let xQuery = { ...(chartProps.xQuery || {}) };
    xQuery.report = chartProps.report;
    xQuery.x = xQuery.query || xQuery.x || query || "";
    delete xQuery.query;
    let options = {
      ...xQuery,
      ...(qs.parse(search.replace(/^\?/, "")) || {}),
    };
    let queryParts = (options.query || options.x || "")
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
      `search?${queryString.replace(/^\?/, "")}#${encodeURIComponent(
        newQuery,
      )}`,
    );
  };

  const longPressCallback = useCallback(
    (e, value) => {
      e.preventDefault();
      e.stopPropagation();
      searchBySequence(value.context);
    },
    [links, chartProps, location],
  );

  const longPress = useLongPress(longPressCallback, {
    onStart: (e) => e.preventDefault(),
    onCancel: (e, value) => {
      handleLabelClick(labelKey(value.context.row, value.context.label));
    },
    captureEvent: true,
    threshold: 500,
  });

  let fillColors = colors.map((hex, i) =>
    fadeColor({ hex, i, active: currentSeries }),
  );
  let { pointSize, layoutSize = pointSize } = chartProps;
  let labelHeight = (layoutSize * 3) / 2;
  let padding = labelHeight / 2;
  let strokeWidth = pointSize / 3;
  // Optional left gutter holding the assembly names, one per row; names shrink to use at most 40% of the width.
  let nameUnits = showGutter ? maxStringLength(assemblyNames, undefined, 1) : 0;
  let nameSize = Math.min(
    padding,
    Math.max(1, (width * 0.4 - padding) / Math.max(nameUnits, 1)),
  );
  let gutter = showGutter ? nameUnits * nameSize + padding : 0;
  let innerWidth = width - gutter;
  // Band above the top row and below the bottom row for outer names.
  let labelBand = outerLabels && !showGutter ? padding * 1.5 : 0;
  let maxLabels = Math.max(...assemblies.map((a) => a.labels.length));
  // Horizontal overflow per label bar, shrunk when there are many labels so
  // that the bars always fit within the width.
  let hPad = Math.min(padding, (innerWidth - 2) / (4 * maxLabels));
  if (width < 100 || assemblies.length < 2) {
    return null;
  }

  let maxSpan = Math.max(
    ...assemblies.map((a) => a.buckets[a.buckets.length - 1] - a.buckets[0]),
  );

  let division = Math.ceil(Math.log10(maxSpan));
  let step = Math.pow(10, division - 2);
  while (maxSpan / step < 50) {
    step /= 2;
  }

  let rowScales = assemblies.map((a) =>
    generateSteppedScale({
      buckets: a.buckets,
      labels: a.labels,
      pad: hPad,
      width: innerWidth,
    }),
  );
  let topCoord = marginTop + labelBand + padding;
  let bottomCoord = height - marginHeight - padding;
  let rowCount = assemblies.length;
  // Centre line of each assembly row, evenly spaced from top to bottom.
  let rowY = assemblies.map(
    (_, row) => topCoord + (row * (bottomCoord - topCoord)) / (rowCount - 1),
  );
  const linkVisible = (link) =>
    Object.keys(visible).length == 0 ||
    visible[labelKey(link.asm1, link.sequenceId)] ||
    visible[labelKey(link.asm2, link.ySequenceId)];

  // Label bars, ticks and tooltips for one assembly row.
  const setChrs = (row) => {
    let { labels, buckets, orientation } = assemblies[row];
    let scales = rowScales[row];
    let chrs = [];
    labels.forEach((label, i) => {
      let key = labelKey(row, label);
      let x1 = scales[label]([buckets[i]]);
      let x2 = scales[label]([buckets[i + 1]]);
      let span = buckets[i + 1] - buckets[i];
      let labelLength = stringLength(label);
      let formattedLabel = label;
      let k = 1;
      while (k < label.length && (labelLength - 2) * padding > x2 - x1) {
        formattedLabel = truncate(label, label.length - k, true);
        labelLength = stringLength(formattedLabel);
        k++;
      }
      let stroke = visible[key] ? "white" : "#31323f";
      let fill = visible[key] ? "#31323f" : "white";
      let inset = padding / 2;
      let barLeft = x1 - hPad;
      let barWidth = x2 - x1 + hPad * 2;
      let expanded = expandedLabel === key && formattedLabel !== label;
      let fullWidth = stringLength(label) * padding + 2 * inset;
      let rectWidth = expanded ? Math.max(barWidth, fullWidth) : barWidth;
      let reversed = orientation[label] == -1;
      let offsets = [];
      if (reversed) {
        for (let n = span; n > 0; n -= step) {
          offsets.push(n);
        }
      } else {
        for (let n = 0; n < span; n += step) {
          offsets.push(n);
        }
      }
      let lines = offsets.map((n) => {
        let x = scales[label]([buckets[i] + n]);
        return (
          <line
            key={n}
            x1={x}
            y1={0}
            x2={x}
            y2={padding * 2}
            stroke={stroke}
            strokeWidth={2}
            strokeDasharray={`${padding / 3} ${(padding * 4) / 3}`}
            strokeLinecap="round"
          />
        );
      });
      let arrows = [];
      if (reversed) {
        arrows.push(
          <polygon
            key="left"
            points={`${x2 - padding / 2},${padding} ${x2 + padding / 2},${padding * 1.75} ${x2 + padding / 2},${padding * 0.25}`}
            fill={"stroke"}
            fillOpacity={0.25}
          />,
        );
      }
      chrs.push(
        <Tooltip
          title={`${label} (${formats(span, "integer")}bp)`}
          arrow
          key={key}
          enterDelay={500}
        >
          <g
            key={key}
            {...longPress({ row, label })}
            style={{ cursor: "pointer" }}
            onMouseEnter={(event) => {
              // SVG has no z-index; move the label to the end of its row so it paints last.
              const group = event.currentTarget;
              group.parentNode.appendChild(group);
              setExpandedLabel(key);
            }}
            onMouseLeave={() => setExpandedLabel(null)}
          >
            <rect
              x={barLeft}
              y={0}
              width={rectWidth}
              height={padding * 2}
              fill={fill}
              stroke={visible[key] ? fill : stroke}
              strokeWidth={2}
              rx={padding}
            />
            {expanded ? null : lines}
            {expanded ? null : arrows}
            <text
              x={expanded ? barLeft + inset : (x1 + x2) / 2}
              y={padding}
              textAnchor={expanded ? "start" : "middle"}
              fontSize={padding}
              dominantBaseline="middle"
              alignmentBaseline="middle"
              fill={stroke}
            >
              {expanded ? label : formattedLabel}
            </text>
          </g>
        </Tooltip>,
      );
    });
    return chrs;
  };
  let rowChrs = assemblies.map((_, row) => (
    <g key={row} transform={`translate(0,${rowY[row] - padding})`}>
      {setChrs(row)}
    </g>
  ));

  let groups = [];
  let legend = [];
  let current = [];
  let clipRect = (
    <clipPath id="clipRect">
      <rect
        x={0}
        y={topCoord}
        width={innerWidth}
        height={bottomCoord - topCoord}
      />
    </clipPath>
  );
  const hasCategories = cats && cats.length > 1;

  const xMin = assemblies[0].buckets[0];
  const xMax = assemblies[0].buckets[assemblies[0].buckets.length - 1];

  // Pass-through links are drawn first so adjacent links sit on top.
  const orderedLinks = [
    ...links.filter((link) => link.passThrough),
    ...links.filter((link) => !link.passThrough),
  ];

  cats.forEach((cat, i) => {
    if (!links.some((link) => link.catIndex == i)) {
      return;
    }
    let handleClick;
    if (cats.length > 1) {
      handleClick = (idx) => {
        currentSeries !== false && currentSeries == idx
          ? setCurrentSeries(false)
          : setCurrentSeries(idx);
      };
    }
    let offset, row;
    if (chartProps.catOffsets[cat]) {
      ({ offset, row } = chartProps.catOffsets[cat]);
    }
    let legendProps = {
      ...chartProps,
      width: width - 45,
      x: 10,
      name: cat,
      fill: colors[i],
      i,
      stats: cat,
    };
    legend.push(
      <g key={`item-${i}`}>
        {MultiCatLegend({
          ...legendProps,
          offset,
          row,
          handleClick,
          active: currentSeries === i,
        })}
      </g>,
    );
  });

  orderedLinks.forEach((link, j) => {
    if (!linkVisible(link)) {
      return;
    }
    const midX = (link.x + link.x2) / 2;
    const midY = (link.y + link.y2) / 2;
    const x = rowScales[link.asm1][link.sequenceId](midX);
    const y = rowScales[link.asm2][link.ySequenceId](midY);
    const startY = rowY[link.asm1];
    const endY = rowY[link.asm2];

    const path = pathRound(3);
    path.moveTo(x, startY);
    path.bezierCurveTo(
      x,
      startY + (endY - startY) * 0.25,
      y,
      startY + (endY - startY) * 0.75,
      y,
      endY,
    );
    const t = xMax === xMin ? 0.5 : (midX - xMin) / (xMax - xMin);

    const stroke = hasCategories
      ? fillColors[link.catIndex]
      : getRampColor({
          hsl: fillColors[link.catIndex],
          t,
          lightnessRange: 20,
        });
    const title = `${link.sequenceId} to ${link.ySequenceId}${link.passThrough ? " (pass-through)" : ""}`;
    let pathSvg = (
      <Tooltip title={title} arrow followCursor={true} key={j}>
        <path
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={
            link.passThrough
              ? `${strokeWidth * 2} ${strokeWidth * 2}`
              : undefined
          }
          strokeLinecap="round"
          opacity={link.passThrough ? 0.5 : 1}
          onClick={() =>
            searchByPoint({
              props: {
                group: link.group,
                featureId: link.featureId,
                yFeatureId: link.yFeatureId,
                cat: link.cat,
                payload: { x: link.sequenceId, y: link.ySequenceId },
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
    if (currentSeries !== false && currentSeries == link.catIndex) {
      current.push(pathSvg);
    } else {
      groups.push(pathSvg);
    }
  });
  let gutterLabels = showGutter
    ? assemblyNames.map((name, row) => (
        <text
          key={row}
          x={gutter - padding / 2}
          y={rowY[row]}
          textAnchor="end"
          fontSize={nameSize}
          fontWeight="bold"
          dominantBaseline="middle"
          fill="#31323f"
        >
          {name}
        </text>
      ))
    : [];
  let outerLabelEls = labelBand
    ? [
        <text
          key="top"
          x={width / 2}
          y={marginTop + labelBand / 2}
          textAnchor="middle"
          fontSize={padding}
          fontWeight="bold"
          dominantBaseline="middle"
          fill="#31323f"
        >
          {assemblyNames[0]}
        </text>,
        <text
          key="bottom"
          x={width / 2}
          y={height - marginHeight / 2}
          textAnchor="middle"
          fontSize={padding}
          fontWeight="bold"
          dominantBaseline="middle"
          fill="#31323f"
        >
          {assemblyNames[rowCount - 1]}
        </text>,
      ]
    : [];
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
            dx={strokeWidth / 2}
            dy={strokeWidth / 2}
            stdDeviation={strokeWidth}
            floodOpacity={0.75}
            floodColor="#31323f"
          />
        </filter>
        {clipRect}
      </defs>
      <g transform={`translate(${gutter},0)`}>
        <g clipPath="url(#clipRect)" id="ribbons">
          <g
            style={{
              ...(currentSeries !== false && { pointerEvents: "none" }),
            }}
          >
            {groups}
          </g>
          <g>{current}</g>
        </g>
        {rowChrs}
      </g>
      {gutterLabels}
      {outerLabelEls}
      <g>{legend}</g>
    </svg>
  );
};

const ReportRibbon = ({
  scatter,
  chartRef,
  report,
  containerRef,
  embedded,
  inModal,
  compactLegend,
  reorient,
  dropShadow,
  assemblyLabels,
  ribbonGutter,
  outerLabels = true,
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
    let plotHeight = height; // inModal ? height : plotWidth / ratio;

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
    let scatterReport =
      scatter.report.scatter || scatter.report.ribbon || scatter.report.oxford;
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
      links,
      assemblies,
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
    if (!heatmaps || !links || !assemblies) {
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
      isShown: (i) => links.some((link) => link.catIndex == i),
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
    const maxXLabel = 0;
    let showGutter = Boolean(ribbonGutter) && ribbonGutter != "false";
    let orientation = 0;
    // Legend keeps pointSize (its text uses it); the band margins shrink so the plot keeps at least 40% of the height.
    let legendHeight = legendRows
      ? legendRows * (compactLegend ? pointSize + 10 : 2 * pointSize + 15)
      : 0;
    let bandFactor = outerLabels && !showGutter ? 3.625 : 2.5;
    let layoutSize = pointSize;
    if (plotHeight > 0) {
      while (
        layoutSize > 4 &&
        5 + legendHeight + layoutSize * bandFactor > plotHeight * 0.6
      ) {
        layoutSize *= 0.9;
      }
    }
    let marginHeight = layoutSize;
    let marginTop = 5 + legendHeight;
    let assemblyLabelList = (assemblyLabels || "").split(";");
    let assemblyNames = assemblies.map(
      (a, row) => (assemblyLabelList[row] || "").trim() || a.assembly_id,
    );
    chart = (
      <Ribbon
        links={links}
        assemblies={assemblies}
        assemblyNames={assemblyNames}
        showGutter={showGutter}
        outerLabels={outerLabels}
        width={plotWidth}
        height={plotHeight}
        marginHeight={marginHeight}
        marginTop={marginTop}
        colors={colors}
        cats={cats}
        dropShadow={dropShadow}
        chartProps={{
          zDomain: heatmaps.zDomain,
          yLength: heatmaps.yBuckets.length - 1,
          xLength: heatmaps.buckets.length - 1,
          n: cats.length,
          zScale: zScale,
          report,
          catSums,
          pointSize,
          layoutSize,
          pointRatio: 1,
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
)(ReportRibbon);
