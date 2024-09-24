import React, { memo, useEffect, useRef, useState } from "react";

import Grid from "@mui/material/Grid2";
import ReportArc from "./ReportArc";
import ReportCaption from "./ReportCaption";
import ReportEmpty from "./ReportEmpty";
import ReportError from "./ReportError";
import ReportHistogram from "./ReportHistogram";
import ReportLoading from "./ReportLoading";
import ReportMap from "./ReportMap";
import ReportRibbon from "./ReportRibbon";
import ReportScatter from "./ReportScatter";
import ReportSources from "./ReportSources";
import ReportTable from "./ReportTable";
import ReportTree from "./ReportTree";
import ReportTypes from "./ReportTypes";
import ReportWrapper from "./ReportWrapper";
import ReportXPerRank from "./ReportXPerRank";
import { compose } from "recompose";
import dispatchMessage from "../hocs/dispatchMessage";
import dispatchReport from "../hocs/dispatchReport";
import { gridPropNames } from "../functions/propNames";
import qs from "../functions/qs";
import { reportHeading as reportHeadingStyle } from "./Styles.scss";
import { useIntersectionObserver } from "usehooks-ts";
import { useNavigate } from "@reach/router";
import useResize from "../hooks/useResize";
import withReportById from "../hocs/withReportById";
import withSiteName from "../hocs/withSiteName";

const headings = {
  tree: "Tap tree nodes to browse taxa or long-press to search",
  histogram: "Tap bins to search",
  oxford: "Tap bins to search",
  ribbon: "Long press to search",
  scatter: "Tap bins to search",
};

const reportIsEmpty = (name, report) => {
  switch (name) {
    case "arc":
      if (
        (Array.isArray(report) && report.length == 0) ||
        (report.x == 0 && report.y == 0)
      ) {
        return true;
      }
      return false;
    case "tree":
      if (report.x == 0 || Object.keys(report.tree.treeNodes).length == 0) {
        return true;
      }
      return false;
    default:
      return report.x == 0;
  }
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
  highlight,
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
  const { isIntersecting: visible, ref: targetRef } = useIntersectionObserver({
    threshold: 0.01,
  });
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
        () =>
          fetchReport({ reportId, queryString, report, hideMessage, inModal }),
        delay,
      );
    }
  }, [reportId, visible]);

  let status;
  if (
    reportById &&
    reportById.report &&
    reportById.report[report] &&
    reportById.report[report].status
  ) {
    status = reportById.report[report].status;
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

  let setDimensions = ({ width, height }) => ({
    plotWidth: width,
    plotHeight: height,
  });

  let captionPadding = 0;
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
    component = (
      <ReportError
        report={report}
        error={error}
        minDim={minDim}
        ratio={ratio}
        inModal={inModal}
      />
    );
    // message = {
    //   message: `Failed to fetch ${report} report`,
    //   duration: 5000,
    //   severity: "error",
    // };
  } else if (
    (reportById.report[report] &&
      reportIsEmpty(report, reportById.report[report])) ||
    !reportById.report[report]
  ) {
    component = <ReportEmpty report={report} inModal={inModal} />;
  } else {
    switch (report) {
      case "arc":
        if (reportById.report && Array.isArray(reportById.report.arc)) {
          // if (fixedRatio && fixedRatio == 1) {
          // if (minDim > 300) {
          if (inModal) {
          } else {
            fixedRatio = 2;
            captionPadding = 3 * pointSize;
          }
          // } else if (minDim > 200) {
          //   fixedRatio = 1.25;
          // }
          // }
        }
        component = (
          <ReportArc
            arc={reportById}
            chartRef={chartRef}
            embedded={embedded}
            inModal={inModal}
            containerRef={containerRef}
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
            inModal={inModal}
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

      case "ribbon":
        component = (
          <ReportRibbon
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
            inModal={inModal}
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
            highlight={highlight}
            includeEstimates={includeEstimates}
            {...qs.parse(queryString)}
            minDim={minDim}
            setMinDim={setMinDim}
          />
        );
        break;
      case "sources":
        fixedRatio = undefined;
        component = (
          <ReportSources
            sources={reportById.report.sources}
            chartRef={chartRef}
            embedded={embedded}
            // containerRef={containerRef}
            minDim={minDim}
            setMinDim={setMinDim}
            inModal={inModal}
            containerRef={targetRef}
          />
        );
        break;
      case "tree":
        if (!permaLink) {
          // fixedRatio *= 1.1;
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
            inModal={inModal}
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
          if (reportById.report && Array.isArray(reportById.report.xPerRank)) {
            fixedRatio = 100;
          }

          captionPadding = reportById.report.xPerRank.length * 27;
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

  setDimensions = ({ width, height, inModal }) => {
    if (inModal && fixedRatio) {
      if (height > width / fixedRatio) {
        return {
          plotWidth: width,
          plotHeight: width / fixedRatio,
        };
      } else {
        let plotWidth = height * fixedRatio;
        return {
          plotWidth,
          plotHeight: height,
        };
      }
    }
    if (fixedRatio) {
      let plotHeight = width / fixedRatio;
      return {
        plotWidth: width,
        plotHeight,
      };
    } else {
      return { plotWidth: width, plotHeight: height };
    }
  };

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
      }}
    >
      {!loading && !error && heading && (inModal || topLevel) && (
        <Grid>
          <span className={reportHeadingStyle}>{heading}</span>
        </Grid>
      )}
      <Grid
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
        <ReportCaption
          caption={caption}
          embedded={embedded}
          inModal={inModal}
          padding={captionPadding}
        />
      )}
    </Grid>
  );
  if (!inModal) {
    content = (
      <ReportWrapper
        id="Modal"
        reportId={reportId}
        report={report}
        disableModal={disableModal}
        queryString={queryString}
        heading={heading}
        caption={caption}
      >
        {content}
      </ReportWrapper>
    );
  }

  let adjustRatio = 1;
  if (fixedRatio && fixedRatio != ratio) {
    adjustRatio = fixedRatio;
  }
  return (
    <Grid
      ref={targetRef}
      style={{
        minHeight: minDim,
        maxWidth: "calc( 100% - 2em )",
        boxSizing: "border-box",
      }}
      {...gridProps}
    >
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
  withReportById,
)(ReportItem);
