import React, { memo, useEffect, useRef, useState } from "react";

import Grid from "@material-ui/core/Grid";
import ReportEmpty from "./ReportEmpty";
import ReportError from "./ReportError";
import ReportHistogram from "./ReportHistogram";
import ReportLoading from "./ReportLoading";
import ReportMap from "./ReportMap";
import ReportModal from "./ReportModal";
import ReportScatter from "./ReportScatter";
import ReportSources from "./ReportSources";
import ReportTree from "./ReportTree";
import ReportXInY from "./ReportXInY";
import ReportXPerRank from "./ReportXPerRank";
import { compose } from "recompose";
import dispatchMessage from "../hocs/dispatchMessage";
import dispatchReport from "../hocs/dispatchReport";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import { useNavigate } from "@reach/router";
import useResize from "../hooks/useResize";
import useVisible from "../hooks/useVisible";
import withReportById from "../hocs/withReportById";
import withSiteName from "../hocs/withSiteName";

const headings = {
  tree: "Tap tree nodes to browse taxa or long-press to search",
  histogram: "Tap bins to search",
  scatter: "Tap bins to search",
};

const ReportItem = ({
  reportId,
  report,
  disableModal,
  embedded,
  queryString,
  fetchReport,
  reportById,
  heading,
  caption,
  inModal,
  topLevel,
  permaLink,
  chartRef,
  containerRef,
  reportRef,
  gridRef,
  componentRef,
  ratio = 1,
  delay = 0,
  stacked,
  cumulative,
  xOpts,
  yOpts,
  highlightArea,
  mapThreshold,
  scatterThreshold,
  yScale,
  zScale,
  treeStyle,
  treeThreshold,
  levels,
  handleUpdate,
  dispatch,
  includeEstimates,
  includeDescendants,
  collapseMonotypic,
  excludeMissing,
  excludeAncestral,
  excludeDirect,
  excludeDescendant,
  setMessage,
  saveReport,
  setReportEdit,
  setReportTerm,
  siteName,
  basename,
  ...gridProps
}) => {
  queryString = qs.stringify({
    xOpts,
    yOpts,
    scatterThreshold,
    treeThreshold,
    mapThreshold,
    ...qs.parse(queryString),
  });
  const navigate = useNavigate();
  const hideMessage = !inModal && !topLevel;
  const targetRef = useRef();
  let visible = useVisible(targetRef);
  const [minDim, basicSetMinDim] = useState(0);
  let setMinDim;

  // const [hideMessage, sethideMessage] = useState(false);

  if (topLevel || inModal) {
    const { width, height } = useResize(targetRef);
    // let minDim = Math.floor(width);
    // if (height) {
    //   minDim = Math.floor(Math.min(width, height));
    // } else {
    //   minDim /= ratio;
    // }
    setMinDim = (value) => {
      // if (!minDim || height > minDim) {
      basicSetMinDim(value);
      // }
    };
  } else {
    setMinDim = basicSetMinDim;
  }

  useEffect(() => {
    if (
      visible &&
      reportId &&
      (!reportById || Object.keys(reportById).length == 0)
    ) {
      // let hideMessage;
      // if (!inModal && !topLevel) {
      //   sethideMessage(true);
      // }
      setTimeout(
        () => fetchReport({ reportId, queryString, report, hideMessage }),
        delay
      );
    }
  }, [reportId, visible]);

  let status;
  if (reportById && reportById.report && reportById.report[report]) {
    if (reportById.report[report].status) {
      status = reportById.report[report].status;
    }
  }

  useEffect(() => {
    if (
      !hideMessage &&
      status &&
      reportById.report[report].status.success == false
    ) {
      setMessage({
        message: `Unable to load ${report} report`,
        duration: 5000,
        severity: "warning",
      });
    }
  }, [status]);
  let component, error, loading;
  if (!reportById || Object.keys(reportById).length == 0) {
    loading = true;
  } else if (
    reportById.report[report] &&
    reportById.report[report].status &&
    reportById.report[report].status.success == false
  ) {
    if (setReportEdit && !hideMessage) {
      setTimeout(() => setReportEdit(true), 500);
    }
    error = reportById.report[report].status.error;
    component = <ReportError report={report} error={error} />;
    // message = {
    //   message: `Failed to fetch ${report} report`,
    //   duration: 5000,
    //   severity: "error",
    // };
  } else if (reportById.report[report] && reportById.report[report].x == 0) {
    component = <ReportEmpty report={report} />;
    // message = {
    //   message: `No ${report} data to display`,
    //   duration: 5000,
    //   severity: "warning",
    // };
  } else if (!reportById.report[report]) {
    component = <ReportEmpty report={report} />;
    // message = {
    //   message: `No ${report} data to display`,
    //   duration: 5000,
    //   severity: "warning",
    // };
  } else {
    switch (report) {
      case "histogram":
        component = (
          <ReportHistogram
            histogram={reportById}
            chartRef={chartRef}
            containerRef={containerRef}
            ratio={ratio}
            embedded={embedded}
            stacked={stacked}
            cumulative={cumulative}
            xOpts={xOpts}
            includeEstimates={includeEstimates}
            // yScale={yScale}
            {...qs.parse(queryString)}
            minDim={minDim}
            setMinDim={setMinDim}
          />
        );
        break;
      case "map":
        component = (
          <ReportMap
            map={reportById}
            chartRef={chartRef}
            containerRef={containerRef}
            ratio={ratio}
            embedded={embedded}
            includeEstimates={includeEstimates}
            {...qs.parse(queryString)}
            minDim={minDim}
            setMinDim={setMinDim}
            mapThreshold={mapThreshold}
          />
        );
        break;
      case "scatter":
        component = (
          <ReportScatter
            scatter={reportById}
            chartRef={chartRef}
            containerRef={containerRef}
            embedded={embedded}
            ratio={ratio}
            xOpts={xOpts}
            yOpts={yOpts}
            highlightArea={highlightArea}
            stacked={stacked}
            zScale={zScale}
            scatterThreshold={scatterThreshold}
            includeEstimates={includeEstimates}
            {...qs.parse(queryString)}
            minDim={minDim}
            setMinDim={setMinDim}
          />
        );
        break;
      case "sources":
        component = (
          <ReportSources
            sources={reportById.report.sources}
            chartRef={chartRef}
            embedded={embedded}
            containerRef={containerRef}
            minDim={minDim}
            setMinDim={setMinDim}
          />
        );
        break;
      case "tree":
        if (!permaLink) {
          permaLink = (queryString, toggle) => {
            let path = "report";
            // TODO: include taxonomy
            navigate(`${basename}/${path}?${queryString.replace(/^\?/, "")}`);
          };
        }
        component = (
          <ReportTree
            reportId={reportId}
            topLevel={topLevel}
            permaLink={permaLink}
            embedded={embedded}
            ratio={ratio}
            tree={reportById}
            chartRef={chartRef}
            containerRef={containerRef}
            reportRef={reportRef}
            gridRef={gridRef}
            treeStyle={treeStyle}
            handleUpdate={handleUpdate}
            dispatch={dispatch}
            includeEstimates={includeEstimates}
            treeThreshold={treeThreshold}
            collapseMonotypic={collapseMonotypic}
            levels={levels}
            hidePreview={hideMessage}
            {...qs.parse(queryString)}
            minDim={minDim}
            setMinDim={setMinDim}
          />
        );
        break;
      case "xPerRank":
        component = (
          <ReportXPerRank
            perRank={reportById}
            chartRef={chartRef}
            embedded={embedded}
            containerRef={containerRef}
            ratio={ratio}
            minDim={minDim}
            setMinDim={setMinDim}
          />
        );
        break;
      case "xInY":
        component = (
          <ReportXInY
            xInY={reportById}
            chartRef={chartRef}
            embedded={embedded}
            containerRef={targetRef}
            ratio={ratio}
            minDim={minDim}
            setMinDim={setMinDim}
          />
        );
        break;
      default:
        break;
    }
  }

  if (!embedded) {
    heading = heading || headings[report];
  }
  if (caption) {
    if (
      caption === true ||
      caption == "true" ||
      caption == "" ||
      caption == "none"
    ) {
      caption = undefined;
    }
  } else {
    caption = reportById?.report?.caption;
  }
  const formatCaption = (caption) => {
    if (caption && caption !== true) {
      let captionArr = [];
      let parts = (caption || "").split("**");
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 == 0) {
          captionArr.push(<span key={i}>{parts[i]}</span>);
        } else {
          captionArr.push(
            <b key={i} style={{ color: "black" }}>
              {parts[i]}
            </b>
          );
        }
      }
      return <span>{captionArr}</span>;
    }
    return;
  };

  let formattedCaption = formatCaption(caption);

  let content = (
    <Grid
      container
      direction="column"
      spacing={1}
      style={{ flexGrow: "1", width: "100%" }}
    >
      {!loading && !error && heading && (inModal || topLevel) && (
        <Grid item xs>
          <span className={styles.reportHeading}>{heading}</span>
        </Grid>
      )}
      <Grid item xs style={{ width: "100%" }}>
        {component}
      </Grid>
      {!loading && !error && caption && (
        <Grid item xs style={{ textAlign: "center" }}>
          <span className={styles.reportCaption}>{formattedCaption}</span>
        </Grid>
      )}
    </Grid>
  );
  if (!inModal) {
    content = (
      <ReportModal
        reportId={reportId}
        report={report}
        disableModal={disableModal}
        queryString={queryString}
        heading={heading}
        caption={caption}
      >
        {content}
      </ReportModal>
    );
  }
  // if (reportById.report) {
  //   content = (
  //     <Grid container direction="column" width="100%">
  //       <Grid item>{content}</Grid>
  //       <Grid item style={{ textAlign: "left" }}>
  //         {reportById.report.caption}
  //       </Grid>
  //     </Grid>
  //   );
  // }
  return (
    <Grid ref={targetRef} style={{ minHeight: minDim }} {...gridProps}>
      <ReportLoading
        report={report}
        chartRef={chartRef}
        containerRef={containerRef}
        ratio={ratio}
        minDim={minDim}
        setMinDim={setMinDim}
        loading={loading}
        content={content}
      />
    </Grid>
  );
};

export default compose(
  memo,
  withSiteName,
  dispatchMessage,
  dispatchReport,
  withReportById
)(ReportItem);
