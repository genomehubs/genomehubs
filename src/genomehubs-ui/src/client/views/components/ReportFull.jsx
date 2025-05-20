import React, { useRef } from "react";
import { useLocation, useNavigate } from "@reach/router";

import Grid from "@mui/material/Grid2";
import Report from "./Report";
import ReportTools from "./ReportTools";
import classnames from "classnames";
import { compose } from "recompose";
import dispatchReport from "../hocs/dispatchReport";
import { markdown as markdownStyle } from "./Styles.scss";
import qs from "qs";
import { useStyles } from "./ReportModalStyles";
import useWindowDimensions from "../hooks/useWindowDimensions";
import withSiteName from "#hocs/withSiteName";

export const ReportFull = ({
  reportId,
  report,
  queryString,
  fetchReport,
  topLevel,
  modalStyle = {},
  handleClose,
  error = false,
  basename,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const classes = useStyles();
  const chartRef = useRef();
  const containerRef = useRef();
  const reportRef = useRef(null);
  const gridRef = useRef(null);
  if (report == "xInY") {
    report = "arc";
  }
  let options = qs.parse(queryString);
  let { plotRatio = "auto" } = options;
  if (
    !report ||
    (report != "scatter" && report != "oxford") ||
    plotRatio == "auto"
  ) {
    plotRatio = undefined;
  }

  const windowDimensions = useWindowDimensions();
  let { height, width } = windowDimensions;
  let marginLeft = 0;
  let modal = false;
  if (Object.keys(modalStyle).length > 0) {
    height *= 0.75;
    width *= 0.75;
    modal = true;
  } else if (topLevel) {
    width *= 0.96;
    if (plotRatio) {
      height = width / plotRatio;
    } else {
      height *= 0.96;
    }
  } else {
    marginLeft = width * -0.05;
    width *= 0.9;
    if (plotRatio) {
      height = width / plotRatio;
    } else {
      height *= 0.9;
    }
  }
  if (report == "sources") {
    width = Math.max(windowDimensions.width * 0.8, 900) - 15;
    // width = windowDimensions.width * 0.9 + marginLeft;
    marginLeft = 0;
  }

  const permaLink = (queryString, toggle) => {
    let path = topLevel ? "report" : toggle ? "reporturl" : "report";
    // TODO: include taxonomy
    navigate(`${basename}/${path}?${queryString.replace(/^\?/, "")}`);
  };

  const handleUpdate = ({ queryString, hash }) => {
    if (hash && !hash.startsWith("#")) {
      hash = "#" + hash;
    } else {
      hash = hash || "";
    }
    navigate(`${location.pathname}?${queryString.replace(/^\?/, "")}${hash}`);
  };

  let reportComponent = (
    <Report
      id="report"
      reportId={reportId}
      report={report}
      queryString={queryString}
      inModal
      chartRef={chartRef}
      containerRef={containerRef}
      reportRef={reportRef}
      gridRef={gridRef}
      topLevel={topLevel}
      permaLink={permaLink}
      embedded={location.pathname == basename + "/reporturl"}
      handleUpdate={
        location.pathname == basename + "/reporturl" ? () => {} : handleUpdate
      }
    />
  );

  let content;
  if (
    report == "sources" ||
    report == "types" ||
    location.pathname == basename + "/reporturl"
  ) {
    content = (
      <Grid
        container
        direction="row"
        style={{
          ...(modal && { ...modalStyle }),
          height,
          width,
          flexGrow: 1,
          maxHeight: "100%",
        }}
        className={classnames(classes.paper, markdownStyle)}
        ref={gridRef}
        size={12}
      >
        <Grid
          align="center"
          ref={containerRef}
          style={{ width: "100%", height: "100%" }}
          size={12}
        >
          {reportComponent}
        </Grid>
      </Grid>
    );
  } else {
    content = (
      <Grid
        container
        direction="row"
        style={{
          ...(modal && { ...modalStyle }),
          height,
          width,
          flexGrow: 1,
          maxHeight: "100%",
        }}
        className={classnames(classes.paper, markdownStyle)}
        ref={gridRef}
        size={12}
      >
        <Grid size={1} />
        <Grid
          align="center"
          ref={containerRef}
          style={{ height: "100%" }}
          size={10}
        >
          {reportComponent}
        </Grid>

        <Grid size={1}>
          <ReportTools
            queryString={queryString}
            reportId={reportId}
            report={report}
            topLevel={topLevel}
            chartRef={chartRef}
          />
        </Grid>
      </Grid>
    );
  }

  return (
    <div
      style={{ marginLeft, height, width, maxHeight: "150%" }}
      onClick={(e) => {
        if (report != "sources" && report != "types") {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      ref={reportRef}
    >
      {content}
    </div>
  );
};

export default compose(withSiteName, dispatchReport)(ReportFull);
