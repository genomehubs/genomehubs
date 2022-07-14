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
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Tooltip from "@material-ui/core/Tooltip";
import axisScales from "../functions/axisScales";
import { compose } from "recompose";
import dispatchMessage from "../hocs/dispatchMessage";
import { format } from "d3-format";
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
  basename,
}) => {
  let query = xQuery.query;
  query = query
    .replaceAll(new RegExp("AND\\s+" + bounds.field + "\\s+AND", "gi"), "AND")
    .replaceAll(
      new RegExp("AND\\s+" + bounds.field + "\\s+>=\\s*[\\w\\d_\\.-]+", "gi"),
      ""
    )
    .replaceAll(
      new RegExp("AND\\s+" + bounds.field + "\\s+<\\s*[\\w\\d_\\.-]+", "gi"),
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
    let val = bounds.stats.cats[xRange[0]].key;
    if (val == "other") {
      let list = [];
      for (let obj of bounds.stats.cats) {
        if (obj.key != "other") {
          list.push(obj.key);
        }
      }
      query += ` AND ${bounds.field} != ${list.join(",")}`;
    } else {
      query += ` AND ${bounds.field} = ${val}`;
    }
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
    let val = yBounds.stats.cats[yRange[0]].key;
    if (val == "other") {
      let list = [];
      for (let obj of yBounds.stats.cats) {
        if (obj.key != "other") {
          list.push(obj.key);
        }
      }
      query += ` AND ${yBounds.field} != ${list.join(",")}`;
    } else {
      query += ` AND ${yBounds.field} = ${val}`;
    }
  } else {
    query += ` AND ${yBounds.field} >= ${yRange[0]} AND ${yBounds.field} < ${yRange[1]}`;
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
    `${basename}/search?${queryString.replace(/^\?/, "")}#${encodeURIComponent(
      query
    )}`
  );
};

const OneDimensionRows = ({ report, chartProps }) => {
  let histograms = report.table.histograms;
  let headers = histograms.buckets.map((bucket) => (
    <TableCell key={bucket}>{bucket}</TableCell>
  ));
  let row = histograms.buckets.map((bucket, i) => (
    <TableCell key={bucket}>{histograms.allValues[i]}</TableCell>
  ));
  let rows = [<TableRow>{row}</TableRow>];

  return { headers, rows };
};

const TwoDimensionRows = ({ report, chartProps }) => {
  let { histograms, cat, cats, xLabel, yLabel } = report.table;
  let buckets = histograms.buckets.filter((bucket) => bucket && bucket !== 0);
  let headers = buckets.map((bucket) => (
    <TableCell key={bucket}>{bucket}</TableCell>
  ));
  if (chartProps.reversed) {
    headers.reverse();
  }
  let rows = [];
  let cumulative = {};
  if (cat) {
    headers.unshift(<TableCell key={cat}>{cat}</TableCell>);
    for (let catObj of cats) {
      if (!cumulative[catObj.key]) {
        cumulative[catObj.key] = 0;
      }
      let values = histograms.byCat[catObj.key];
      let row = buckets.map((bucket, i) => {
        let value = values[i] || 0;
        if (chartProps.cumulative) {
          value += cumulative[catObj.key];
          cumulative[catObj.key] = value;
        }
        return <TableCell key={bucket}>{value}</TableCell>;
      });
      if (chartProps.reversed) {
        row.reverse();
      }
      row.unshift(<TableCell key={catObj.key}>{catObj.label}</TableCell>);
      rows.push(<TableRow key={catObj.key}>{row}</TableRow>);
    }
  }

  return { headers, rows };
};

const DimensionTable = ({ report, chartProps }) => {
  let { cat, xLabel, yLabel } = report.table;
  let headers, rows;
  if (cat && yLabel) {
    ({ headers, rows } = TwoDimensionRows({ report, chartProps }));
  } else if (cat || yLabel) {
    ({ headers, rows } = TwoDimensionRows({ report, chartProps }));
  } else if (xLabel) {
    ({ headers, rows } = OneDimensionRows({ report, chartProps }));
  } else {
    return null;
  }
  return (
    <div
      style={{
        height: chartProps.height,
        overflowY: "auto",
        marginBottom: "1em",
      }}
    >
      <Table size={"small"} className={styles.autoWidth}>
        <TableHead>
          <TableRow>{headers}</TableRow>
        </TableHead>
        <TableBody>{rows}</TableBody>
      </Table>
    </div>
  );
};

const ReportTable = ({
  table,
  chartRef,
  containerRef,
  embedded,
  ratio,
  setMessage,
  cumulative,
  reversed,
  reportTerm,
  colors,
  minDim,
  setMinDim,
  xOpts,
  yOpts,
  basename,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [highlight, setHighlight] = useState([]);
  const componentRef = chartRef ? chartRef : useRef();
  const { width, height } = containerRef
    ? useResize(containerRef)
    : useResize(componentRef);
  useEffect(() => {
    if (table && table.status) {
      setMessage(null);
    }
  }, [table]);

  let content;
  let chartProps = { cumulative, reversed, height: minDim - 25 };
  if (table && table.status) {
    content = DimensionTable({ report: table.report, chartProps });

    // let chart;
    // let {
    //   bounds,
    //   yBounds,
    //   cats,
    //   catSums,
    //   chartData,
    //   histograms: heatmaps,
    //   pointData,
    // } = table.report.scatter;

    // if (!heatmaps) {
    //   return null;
    // }
    //   let hasRawData = pointData && pointData.length > 0;
    //   let xOptions = (xOpts || "").split(";");
    //   if (xOptions.length == 1) {
    //     xOptions = xOptions[0].split(",");
    //   }
    //   let yOptions = (yOpts || "").split(";");
    //   if (yOptions.length == 1) {
    //     yOptions = yOptions[0].split(",");
    //   }
    //   let xLabel = xOptions[4] || scatter.report.xLabel;
    //   let yLabel = yOptions[4] || scatter.report.yLabel;
    //   let valueType = heatmaps.valueType;
    //   let yValueType = heatmaps.yValueType || "integer";
    //   let lastIndex = heatmaps.buckets.length - 2;
    //   let interval;
    //   if (valueType == "date") {
    //     let start = heatmaps.buckets[0];
    //     let end = heatmaps.buckets[lastIndex + 1];
    //     let diff = end - start;
    //     interval = setInterval(diff, lastIndex);
    //   }
    //   let yInterval;
    //   if (yValueType == "date") {
    //     let start = heatmaps.yBuckets[0];
    //     let end = heatmaps.yBuckets[heatmaps.yBuckets.length - 1];
    //     let diff = end - start;
    //     yInterval = setInterval(diff, heatmaps.yBuckets.length - 1);
    //   }

    //   let endLabel = formats(
    //     heatmaps.buckets[lastIndex + 1],
    //     valueType,
    //     interval
    //   );

    //   const {
    //     translations,
    //     catTranslations,
    //     catOffsets,
    //     legendRows,
    //     yTranslations,
    //   } = processLegendData({ bounds, yBounds, width });

    //   chart = (
    //     <Heatmap
    //       data={chartData}
    //       pointData={1 ? pointData : []}
    //       width={width}
    //       height={minDim - 50}
    //       buckets={heatmaps.buckets}
    //       yBuckets={heatmaps.yBuckets}
    //       cats={cats}
    //       xLabel={xLabel}
    //       yLabel={yLabel}
    //       endLabel={endLabel}
    //       lastIndex={lastIndex}
    //       highlight={highlight}
    //       highlightArea={highlightArea}
    //       colors={colors}
    //       legendRows={legendRows}
    //       chartProps={{
    //         zDomain: heatmaps.zDomain,
    //         yLength: heatmaps.yBuckets.length - 1,
    //         xLength: heatmaps.buckets.length - 1,
    //         n: cats.length,
    //         zScale: zScale,
    //         catSums,
    //         xQuery: scatter.report.xQuery,
    //         yQuery: scatter.report.yQuery,
    //         xLabel: scatter.report.xLabel,
    //         yLabel: scatter.report.yLabel,
    //         showXTickLabels: xOptions[2]
    //           ? xOptions[2] >= 0
    //             ? true
    //             : false
    //           : true,
    //         showYTickLabels: yOptions[2]
    //           ? yOptions[2] >= 0
    //             ? true
    //             : false
    //           : true,
    //         xFormat: (value) => formats(value, valueType, interval),
    //         yFormat: (value) => formats(value, yValueType, yInterval),
    //         fields: heatmaps.fields,
    //         ranks: heatmaps.ranks,
    //         bounds,
    //         yBounds,
    //         translations,
    //         yTranslations,
    //         catTranslations,
    //         catOffsets,
    //         valueType,
    //         yValueType,
    //         stacked,
    //         hasRawData,
    //         embedded,
    //         navigate,
    //         location,
    //         basename,
    //       }}
    //     />
    //   );
    return (
      <Grid item xs ref={componentRef} style={{ height: "100%" }}>
        {content}
      </Grid>
    );
  }
};

export default compose(
  withSiteName,
  dispatchMessage,
  withColors,
  withReportTerm
)(ReportTable);
