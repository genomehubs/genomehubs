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

const TableReport = ({ report, chartProps }) => {
  const { headers, rows } = report.table;
  if (!headers) {
    return null;
  }
  let tableHeader = (
    <TableRow key={"header"}>
      {headers.map((header) => (
        <TableCell key={header.key}>{header.label}</TableCell>
      ))}
    </TableRow>
  );
  let tableRows = rows.map((row) => {
    let cumulative = 0;

    let rowArr = row.map((cell) => {
      let value = cell.label || cell.value;
      if (cell.hasOwnProperty("count")) {
        value = cell.count || 0;
        if (chartProps.cumulative) {
          value += cumulative;
          cumulative = value;
        }
      }
      return <TableCell key={cell.key}>{value}</TableCell>;
    });

    return <TableRow key={row[0].value}>{rowArr}</TableRow>;
  });

  return (
    <div
      style={{
        height: chartProps.height,
        overflowY: "auto",
        marginBottom: "1em",
      }}
    >
      <Table size={"small"} className={styles.autoWidth}>
        <TableHead>{tableHeader}</TableHead>
        <TableBody>{tableRows}</TableBody>
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
    content = TableReport({ report: table.report, chartProps });

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
