import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "@reach/router";

import { Box } from "@material-ui/core";
import FlagIcon from "./FlagIcon";
import Grid from "@material-ui/core/Grid";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TablePagination from "@material-ui/core/TablePagination";
import TableRow from "@material-ui/core/TableRow";
import Tooltip from "./Tooltip";
import TranslatedValue from "./TranslatedValue";
import { compose } from "recompose";
import dispatchMessage from "../hocs/dispatchMessage";
import styles from "./Styles.scss";
import useResize from "../hooks/useResize";
import withReportTerm from "../hocs/withReportTerm";
import withSiteName from "../hocs/withSiteName";
import { withStyles } from "@material-ui/core/styles";

const StyledTableCell = withStyles((theme) => ({
  head: {
    backgroundColor: "#1f78b433",
    fontWeight: 700,
  },
  body: {
    backgroundColor: "#1f78b411",
    fontWeight: 700,
  },
}))(TableCell);

const TableReport = ({ report, chartProps, ...props }) => {
  const { headers, rows } = report.table;
  let [highlightField, highlightValue] = (chartProps.highlight || "").split(
    "="
  );
  let highlightRow = -1;
  if (highlightField) {
    let col = headers.map((obj) => obj.key).indexOf(highlightField);
    if (col > -1) {
      highlightRow = rows.map((arr) => arr[col].value).indexOf(highlightValue);
    }
  }
  let defaultRowsPerPage = 10;
  let highlightPage = 0;
  if (highlightRow > -1) {
    highlightPage = Math.floor(highlightRow / defaultRowsPerPage);
  }
  const [page, setPage] = React.useState(highlightPage);
  const [rowsPerPage, setRowsPerPage] = React.useState(defaultRowsPerPage);
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };
  if (!headers) {
    return null;
  }
  const showIndex = headers[0].key == "country_list" ? true : false;
  let tableHeader = (
    <TableRow key={"header"}>
      {showIndex && <StyledTableCell key="index"></StyledTableCell>}
      {headers.map((header) => (
        <StyledTableCell key={header.key}>{header.label}</StyledTableCell>
      ))}
    </TableRow>
  );
  let tableRows = rows
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    .map((row, j) => {
      let cumulative = 0;
      const Cell =
        j + page * rowsPerPage == highlightRow ? StyledTableCell : TableCell;
      let rowArr = row.map((cell, i) => {
        let value = cell.label || cell.value;
        let textAlign = "left";
        let maxWidth;
        let minWidth;
        if (cell.hasOwnProperty("count")) {
          value = cell.count || 0;
          if (chartProps.cumulative) {
            value += cumulative;
            cumulative = value;
          }
          textAlign = "right";
        } else if (i == 0 && headers[0].key == "country_list") {
          value = (
            <span style={{ whiteSpace: "nowrap" }}>
              <div style={{ width: "40px", display: "inline-block" }}>
                <FlagIcon countryCode={cell.label} size={30} />
              </div>
              <TranslatedValue type={headers[0].key} text={cell.label} />
            </span>
          );
          maxWidth = "15em";
          minWidth = "15em";
        }
        return (
          <Cell
            key={cell.key}
            style={{ textAlign, maxWidth, minWidth, overflow: "hidden" }}
          >
            {value}
          </Cell>
        );
      });
      if (showIndex) {
        rowArr.unshift(
          <Cell key="index" style={{ textAlign: "right" }}>
            {j + page * rowsPerPage + 1}
          </Cell>
        );
      }

      return <TableRow key={`${row[0].key}-${j}`}>{rowArr}</TableRow>;
    });

  return (
    <div
      style={{
        height: chartProps.height,
        overflowY: "auto",
        marginBottom: "1em",
      }}
    >
      <Grid
        container
        direction="column"
        alignItems="center"
        justifyContent="center"
      >
        <Grid item>
          <Table size={"small"} className={styles.autoWidth}>
            <TableHead>{tableHeader}</TableHead>
            <TableBody>{tableRows}</TableBody>
          </Table>
        </Grid>
        {rows.length > 5 && (
          <Grid item>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 100]}
              component="div"
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Grid>
        )}
      </Grid>
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
  highlight,
  minDim,
  setMinDim,
  xOpts,
  yOpts,
  basename,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
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
  let chartProps = { cumulative, reversed, highlight, height: minDim - 25 };
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
  withReportTerm
)(ReportTable);
