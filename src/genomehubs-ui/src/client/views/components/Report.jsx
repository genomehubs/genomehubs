import React, { memo, useRef } from "react";

import ReportItem from "./ReportItem";
import { compose } from "recompose";
import qs from "../functions/qs";
import { sortReportQuery } from "../selectors/report";
import { useLocation } from "@reach/router";
import useResize from "../hooks/useResize";
import withTaxonomy from "../hocs/withTaxonomy";

export const queryPropList = [
  "result",
  "report",
  "x",
  "y",
  "z",
  "cat",
  "rank",
  "taxonomy",
  "includeEstimates",
  "treeStyle",
  "phylopicRank",  
  "phylopicSize",
];

const Report = ({
  taxonomy,
  taxonomies,
  taxonomyIsFetching,
  fetchTaxonomies,
  setTaxonomy,
  id,
  ...props
}) => {
  const location = useLocation();
  // const reportRef = useRef();
  let options = qs.parse(location.search.replace(/^\?/, ""));
  props.report = props.report.replace("xInY", "arc");
  let reportProps = { ...props };
  let queryProps = {};
  if (options.taxonomy) {
    queryProps = { taxonomy: options.taxonomy };
  } else {
    queryProps = { taxonomy };
  }
  if (!props.report) {
    return null;
  }
  queryProps.report = props.report;
  queryProps.disableModal = props.disableModal;
  if (!props.result) {
    reportProps.result = "taxon";
    queryProps.result = "taxon";
  }
  if (props.caption) {
    queryProps.caption = props.caption;
  }
  if (!reportProps.queryString) {
    //   reportProps.queryString = sortReportQuery({
    //     queryString: reportProps.queryString,
    //   });
    // } else {
    //   // queryPropList.forEach((prop) => {
    //   if (props.hasOwnProperty(prop)) {
    //     queryProps[prop] = props[prop];
    //   }
    // });
    reportProps.queryString = sortReportQuery({ options: queryProps });
  }
  if (props.reportId) {
    reportProps.reportId = sortReportQuery({
      queryString: reportProps.reportId,
    });
  } else {
    reportProps.reportId = sortReportQuery({
      options: { ...props, ...queryProps },
    });
  }
  reportProps.embedded = props.embedded;
  reportProps.inModal = props.inModal;
  reportProps.permaLink = props.permaLink;
  reportProps.handleUpdate = props.handleUpdate;
  reportProps.chartRef = props.chartRef;
  reportProps.delay = props.delay;
  reportProps.containerRef = props.containerRef;
  reportProps.reportRef = props.reportRef;
  reportProps.gridRef = props.gridRef;
  reportProps.topLevel = props.topLevel;
  reportProps.ratio = props.ratio || 1;
  reportProps.stacked = props.stacked;
  reportProps.cumulative = props.cumulative;
  reportProps.reversed = props.reversed;
  reportProps.yScale = props.yScale || "linear";
  reportProps.zScale = props.zScale || "linear";
  reportProps.xOpts = props.xOpts;
  reportProps.treeStyle = props.treeStyle || "rect";
  reportProps.plotRatio = props.plotRatio || "auto";
  reportProps.yOpts = props.yOpts;
  reportProps.highlightArea = props.highlightArea;
  reportProps.mapThreshold = props.mapThreshold;
  reportProps.scatterThreshold = props.scatterThreshold;
  reportProps.treeThreshold = props.treeThreshold;
  reportProps.compactLegend = props.compactLegend;
  reportProps.dropShadow = props.dropShadow;
  reportProps.reorient = props.reorient;
  reportProps.compactWidth = props.compactWidth;
  reportProps.pointSize =
    props.pointSize * 1 ||
    qs.parse(reportProps.queryString).pointSize * 1 ||
    15;
  reportProps.collapseMonotypic = props.collapseMonotypic;
  reportProps.hideSourceColors = props.hideSourceColors;
  reportProps.hideErrorBars = props.hideErrorBars;
  reportProps.hideAncestralBars = props.hideAncestralBars;
  reportProps.showPhylopics = props.showPhylopics;
  reportProps.phylopicRank = props.phylopicRank;  
  reportProps.phylopicSize = props.phylopicSize ? parseInt(props.phylopicSize) : undefined;
  reportProps.highlight = props.highlight;
  reportProps.colorPalette = props.colorPalette;
  reportProps.excludeAncestral = props.excludeAncestral;
  reportProps.excludeDescendant = props.excludeDescendant;
  reportProps.excludeDirect = props.excludeDirect;
  reportProps.excludeMissing = props.excludeMissing;
  reportProps.levels = props.levels;
  reportProps.caption =
    props.caption || qs.parse(reportProps.queryString).caption;
  reportProps.id = props.id || queryProps.report;

  const componentRef = useRef();
  const { width, height } = useResize(componentRef);
  let minDim = Math.floor(width);
  if (height) {
    minDim = Math.floor(Math.min(width, height));
  } else {
    minDim /=
      reportProps.plotRatio && !Number.isNaN(reportProps.plotRatio)
        ? reportProps.plotRatio
        : reportProps.ratio;
  }
  return (
    <ReportItem
      id={reportProps.id}
      {...reportProps}
      componentRef={componentRef}
      height={minDim}
    />
  );
};

export default compose(memo, withTaxonomy)(Report);
