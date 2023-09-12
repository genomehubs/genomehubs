import React, { useEffect, useRef } from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";

import Grid from "@material-ui/core/Grid";
import LaunchIcon from "@material-ui/icons/Launch";
import NavLink from "./NavLink";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Tooltip from "./Tooltip";
import { compose } from "recompose";
import useResize from "../hooks/useResize";
import withTypes from "../hocs/withTypes";

const StyledTableCell = withStyles((theme) => ({
  head: {
    backgroundColor: "#d2e4f0",
    fontWeight: 700,
  },
}))(TableCell);

const ReportSources = ({
  sources,
  types,
  chartRef,
  containerRef,
  minDim,
  setMinDim,
  inModal,
}) => {
  const componentRef = chartRef ? chartRef : useRef();
  const { width, height } = useResize(containerRef);
  const { width: componentWidth, height: componentHeight } =
    useResize(componentRef);

  const setDimensions = ({ width, height, timer, ratio = 1 }) => {
    let plotHeight = inModal ? height : componentHeight;
    let plotWidth = width;

    let dimensionTimer;
    if (timer && !inModal) {
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
    if (!inModal) {
      if (width > 0) {
        ({ plotWidth, plotHeight, dimensionTimer } = setDimensions({
          width,
          height: componentRef.current
            ? componentRef.current.clientHeight
            : height,
          timer: true,
        }));
        return () => {
          clearTimeout(dimensionTimer);
        };
      }
    }
  }, [width]);

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
    <Grid id="sources" item xs style={{ maxHeight: minDim, overflowY: "auto" }}>
      <Table stickyHeader size="small" ref={componentRef}>
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
