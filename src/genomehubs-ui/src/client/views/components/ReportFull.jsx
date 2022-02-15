import React, { Fragment, useRef, useState } from "react";
import { useLocation, useNavigate } from "@reach/router";

import Grid from "@material-ui/core/Grid";
import Report from "./Report";
import ReportTools from "./ReportTools";
import classnames from "classnames";
import { compose } from "recompose";
import dispatchReport from "../hocs/dispatchReport";
import styles from "./Styles.scss";
import { useStyles } from "./ReportModal";
import useWindowDimensions from "../hooks/useWindowDimensions";

export const ReportFull = ({
  reportId,
  report,
  queryString,
  fetchReport,
  topLevel,
  modalStyle = {},
  handleClose,
  error = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const classes = useStyles();
  const chartRef = useRef();
  const containerRef = useRef();
  const reportRef = useRef(null);
  const gridRef = useRef(null);

  const windowDimensions = useWindowDimensions();
  let height = windowDimensions.height;
  let width = windowDimensions.width;
  let marginLeft = 0;
  let modal = false;
  if (Object.keys(modalStyle).length > 0) {
    height *= 0.75;
    width *= 0.75;
    modal = true;
  } else if (topLevel) {
    width *= 0.96;
    height *= 0.96;
  } else {
    marginLeft = width * -0.05;
    width *= 0.9;
    height *= 0.9;
  }

  const permaLink = (queryString, toggle) => {
    let path = topLevel ? "report" : toggle ? "reporturl" : "report";
    // TODO: include taxonomy
    navigate(`/${path}?${queryString.replace(/^\?/, "")}`);
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
      handleUpdate={handleUpdate}
    />
  );

  let content = (
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
      className={classnames(classes.paper, styles.markdown)}
      ref={gridRef}
    >
      <Grid item xs={1} />
      <Grid
        item
        // xs={edit || query || info || download ? 5 : 10}
        xs={10}
        align="center"
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
      >
        {reportComponent}
      </Grid>

      <Grid item xs={1}>
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
  return (
    <div
      style={{ marginLeft, height, width, maxHeight: "100%" }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      ref={reportRef}
    >
      {content}
    </div>
  );
};

export default compose(dispatchReport)(ReportFull);
