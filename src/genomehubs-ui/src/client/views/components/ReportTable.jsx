import React, { useEffect, useRef } from "react";

import FlagIcon from "./FlagIcon";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TranslatedValue from "./TranslatedValue";
import { autoWidth as autoWidthStyle } from "./Styles.scss";
import { compose } from "redux";
import dispatchMessage from "#hocs/dispatchMessage";
import withReportTerm from "#hocs/withReportTerm";
import withSiteName from "#hocs/withSiteName";
import withStyles from "@mui/styles/withStyles";

const StyledTableCell = withStyles((theme) => ({
  head: {
    backgroundColor: "#d2e4f0",
    fontWeight: 700,
  },
  body: {
    backgroundColor: "#f0f6fa",
    fontWeight: 700,
  },
}))(TableCell);

const TableReport = ({ report, chartProps }) => {
  const { headers, rows } = report.table;
  let [highlightField, highlightValue] = (chartProps.highlight || "").split(
    "=",
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
  const showIndex = !!(headers[0].key == "country_list");
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
          </Cell>,
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
        <Grid>
          <Table size={"small"} className={autoWidthStyle}>
            <TableHead>{tableHeader}</TableHead>
            <TableBody>{tableRows}</TableBody>
          </Table>
        </Grid>
        {rows.length > 5 && (
          <Grid>
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
  message,
  setMessage,
  cumulative,
  reversed,
  highlight,
  minDim,
}) => {
  const componentRef = chartRef || useRef();

  useEffect(() => {
    if (message && table && table.status) {
      setMessage(null);
    }
  }, [table]);

  let content;
  let chartProps = { cumulative, reversed, highlight, height: minDim - 25 };
  if (table && table.status) {
    content = TableReport({ report: table.report, chartProps });

    return (
      <Grid ref={componentRef} style={{ height: "100%" }} size="grow">
        {content}
      </Grid>
    );
  }
};

export default compose(
  withSiteName,
  dispatchMessage,
  withReportTerm,
)(ReportTable);
