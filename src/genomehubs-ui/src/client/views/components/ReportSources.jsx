import React, { useRef } from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";

import Grid from "@material-ui/core/Grid";
import LaunchIcon from "@material-ui/icons/Launch";
import NavLink from "./NavLink";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Tooltip from "@material-ui/core/Tooltip";
import { compose } from "recompose";
import withTypes from "../hocs/withTypes";

const StyledTableCell = withStyles((theme) => ({
  head: {
    backgroundColor: "#eeeeee",
    fontWeight: 700,
  },
}))(TableCell);

const ReportSources = ({ sources, minDim, types }) => {
  let rows = [];
  let sorted = Object.entries(sources || []).sort(
    (a, b) => parseInt(b[1].count || 0) - parseInt(a[1].count || 0)
  );
  sorted.forEach(([key, source], index) => {
    let sourceName;
    if (key == "INSDC") {
      sourceName = (
        <span>
          INSDC (
          <NavLink
            style={{ whiteSpace: "nowrap" }}
            href={"https://www.ebi.ac.uk/ena/browser/home"}
          >
            {"ENA"}
          </NavLink>{" "}
          <NavLink
            style={{ whiteSpace: "nowrap" }}
            href={"https://www.ncbi.nlm.nih.gov"}
          >
            {"NCBI"}
          </NavLink>
          )
        </span>
      );
    } else {
      sourceName = source.url ? (
        <NavLink href={source.url}>{key}</NavLink>
      ) : (
        key
      );
    }
    if (source.date) {
      let displayDate;
      if (!Array.isArray(source.date)) {
        displayDate = source.date;
      } else if (source.date[0] == source.date[1]) {
        displayDate = source.date[0];
      } else {
        displayDate = `${source.date[0]} to ${source.date[1]}`;
      }
      sourceName = (
        <Tooltip title={`Updated: ${displayDate}`} arrow placement={"top"}>
          <span>{sourceName}</span>
        </Tooltip>
      );
    }
    rows.push(
      <TableRow key={index}>
        <TableCell>{sourceName}</TableCell>
        <TableCell>
          {source.count ? (
            <Tooltip
              title={
                source.attributes.length > 1
                  ? `Total across ${source.attributes.length} attributes`
                  : `Number of ${source.attributes[0]} values`
              }
              arrow
              placement={"top"}
            >
              <span>{source.count.toLocaleString()}</span>
            </Tooltip>
          ) : (
            ""
          )}
        </TableCell>
        <TableCell>
          {source.attributes &&
            source.attributes.map((attr, i) => {
              let content;
              if (types[attr] && types[attr].description) {
                content = (
                  <Tooltip
                    key={`${key}-${attr}`}
                    title={types[attr].description}
                    arrow
                    placement={"top"}
                  >
                    <span>{attr}</span>
                  </Tooltip>
                );
              } else {
                content = <span key={`${key}-${attr}`}>{attr}</span>;
              }
              if (i < source.attributes.length - 1) {
                return <span key={`${key}-${attr}`}>{content}; </span>;
              }
              return content;
            })}
        </TableCell>
      </TableRow>
    );
  });
  return (
    <Grid item xs style={{ maxHeight: minDim, overflowY: "auto" }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <StyledTableCell>Source</StyledTableCell>
            <StyledTableCell>Values</StyledTableCell>
            <StyledTableCell>Attributes</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>{rows}</TableBody>
      </Table>
    </Grid>
  );
};

export default compose(withTypes)(ReportSources);
