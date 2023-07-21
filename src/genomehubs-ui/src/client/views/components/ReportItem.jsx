import React, { memo, useEffect, useRef, useState } from "react";

import Grid from "@material-ui/core/Grid";
import ReportArc from "./ReportArc";
import ReportCaption from "./ReportCaption";
import ReportEmpty from "./ReportEmpty";
import ReportError from "./ReportError";
import ReportHistogram from "./ReportHistogram";
import ReportLoading from "./ReportLoading";
import ReportMap from "./ReportMap";
import ReportModal from "./ReportModal";
import ReportScatter from "./ReportScatter";
import ReportSources from "./ReportSources";
import ReportTable from "./ReportTable";
import ReportTree from "./ReportTree";
import ReportTypes from "./ReportTypes";
import ReportXPerRank from "./ReportXPerRank";
import { compose } from "recompose";
import dispatchMessage from "../hocs/dispatchMessage";
import dispatchReport from "../hocs/dispatchReport";
import { gridPropNames } from "../functions/propNames";
import qs from "../functions/qs";
import stringLength from "../functions/stringLength";
import styles from "./Styles.scss";
import { useNavigate } from "@reach/router";
import useResize from "../hooks/useResize";
import useVisible from "../hooks/useVisible";
import withReportById from "../hocs/withReportById";
import withSiteName from "../hocs/withSiteName";

const headings = {
  tree: "Tap tree nodes to browse taxa or long-press to search",
  histogram: "Tap bins to search",
  oxford: "Tap bins to search",
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
  reversed,
  xOpts,
  yOpts,
  compactLegend,
  compactWidth,
  highlightArea,
  mapThreshold,
  scatterThreshold,
  yScale,
  zScale,
  pointSize,
  treeStyle,
  plotRatio,
  treeThreshold,
  levels,
  handleUpdate,
  dispatch,
  includeEstimates,
  includeDescendants,
  collapseMonotypic,
  colorPalette,
  excludeMissing,
  excludeAncestral,
  excludeDirect,
  excludeDescendant,
  setMessage,
  saveReport,
  setReportEdit,
  setReportSelect,
  setReportTerm,
  siteName,
  basename,
  ...props
}) => {
  let reportProps = [];
  let gridProps = [];
  for (let [key, value] of Object.entries(props)) {
    if (gridPropNames.has(key)) {
      gridProps[key] = value;
    } else {
      reportProps[key] = value;
    }
  }
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

  if (typeof embedded === "undefined") {
    pointSize = 15;
  } else if (pointSize) {
    pointSize *= 1;
  }

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
  let fixedRatio;
  if (!inModal || typeof ratio === "string") {
    fixedRatio = ratio;
  }

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
      case "arc":
        if (reportById.report && Array.isArray(reportById.report.arc)) {
          if (fixedRatio && fixedRatio == 1) {
            if (minDim > 300) {
              fixedRatio = 1.5;
            } else if (minDim > 200) {
              fixedRatio = 1.25;
            }
          }
        }
        component = (
          <ReportArc
            arc={reportById}
            chartRef={chartRef}
            embedded={embedded}
            containerRef={targetRef}
            colorPalette={colorPalette}
            ratio={fixedRatio || ratio}
            pointSize={pointSize}
            minDim={minDim}
            setMinDim={setMinDim}
          />
        );
        break;
      case "histogram":
        component = (
          <ReportHistogram
            histogram={reportById}
            chartRef={chartRef}
            containerRef={containerRef}
            ratio={ratio}
            colorPalette={colorPalette}
            embedded={embedded}
            stacked={stacked}
            cumulative={cumulative}
            xOpts={xOpts}
            compactLegend={compactLegend}
            compactWidth={compactWidth}
            includeEstimates={includeEstimates}
            pointSize={pointSize}
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
            colorPalette={colorPalette}
            embedded={embedded}
            includeEstimates={includeEstimates}
            {...qs.parse(queryString)}
            minDim={minDim}
            setMinDim={setMinDim}
            mapThreshold={mapThreshold}
          />
        );
        break;
      case "oxford":
        component = (
          <ReportScatter
            scatter={reportById}
            chartRef={chartRef}
            containerRef={containerRef}
            embedded={embedded}
            ratio={ratio}
            colorPalette={colorPalette}
            xOpts={xOpts}
            yOpts={yOpts}
            compactLegend={compactLegend}
            compactWidth={compactWidth}
            highlightArea={highlightArea}
            stacked={stacked}
            pointSize={pointSize}
            zScale={zScale}
            scatterThreshold={scatterThreshold}
            includeEstimates={includeEstimates}
            {...qs.parse(queryString)}
            minDim={minDim}
            setMinDim={setMinDim}
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
            colorPalette={colorPalette}
            ratio={ratio}
            xOpts={xOpts}
            yOpts={yOpts}
            compactLegend={compactLegend}
            compactWidth={compactWidth}
            highlightArea={highlightArea}
            stacked={stacked}
            pointSize={pointSize}
            zScale={zScale}
            scatterThreshold={scatterThreshold}
            includeEstimates={includeEstimates}
            {...qs.parse(queryString)}
            minDim={minDim}
            setMinDim={setMinDim}
          />
        );
        break;
      case "table":
        component = (
          <ReportTable
            table={reportById}
            chartRef={chartRef}
            containerRef={containerRef}
            embedded={embedded}
            ratio={ratio}
            xOpts={xOpts}
            yOpts={yOpts}
            cumulative={cumulative}
            reversed={reversed}
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
            colorPalette={colorPalette}
            chartRef={chartRef}
            containerRef={containerRef}
            reportRef={reportRef}
            gridRef={gridRef}
            treeStyle={treeStyle}
            pointSize={pointSize}
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
      case "types":
        component = (
          <ReportTypes
            types={reportById.report.types}
            chartRef={chartRef}
            embedded={embedded}
            containerRef={containerRef}
            minDim={minDim}
            setMinDim={setMinDim}
          />
        );
        break;
      case "xPerRank":
        if (fixedRatio && fixedRatio == 1) {
          fixedRatio = 1.5;
          if (reportById.report && Array.isArray(reportById.report.xPerRank));
          fixedRatio = minDim / (reportById.report.xPerRank.length * 27);
        }
        component = (
          <ReportXPerRank
            perRank={reportById}
            chartRef={chartRef}
            embedded={embedded}
            containerRef={containerRef}
            ratio={fixedRatio || ratio}
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
  let content = (
    <Grid
      container
      direction="column"
      spacing={1}
      style={{
        flexGrow: "1",
        width: "100%",
        // background: "rgba(240,240,240,0.5)",
      }}
    >
      {!loading && !error && heading && (inModal || topLevel) && (
        <Grid item xs>
          <span className={styles.reportHeading}>{heading}</span>
        </Grid>
      )}
      <Grid
        item
        xs
        style={{
          width: "100%",
          // background: "rgba(240,240,240,0.5)",
          position: "relative",
          ...(fixedRatio && {
            paddingTop: `${(1 / fixedRatio) * 100}%`,
          }),
        }}
      >
        <div
          style={{
            ...(fixedRatio && {
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
            }),
          }}
        >
          {component}
        </div>
      </Grid>
      {!loading && !error && caption && (
        <ReportCaption caption={caption} embedded={embedded} />
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
  let adjustRatio = 1;
  if (fixedRatio && fixedRatio != ratio) {
    adjustRatio = fixedRatio;
  }
  return (
    <Grid
      ref={targetRef}
      style={{ minHeight: minDim / adjustRatio }}
      {...gridProps}
    >
      <ReportLoading
        report={report}
        chartRef={chartRef}
        containerRef={containerRef}
        ratio={ratio}
        minDim={minDim / adjustRatio}
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
