import React, { Fragment, useEffect, useRef } from "react";

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
  reportProps.yScale = props.yScale || "linear";
  reportProps.zScale = props.yScale || "linear";
  reportProps.xOpts = props.xOpts;
  reportProps.treeStyle = props.treeStyle || "rect";
  reportProps.yOpts = props.yOpts;
  reportProps.highlightArea = props.highlightArea;
  reportProps.mapThreshold = props.mapThreshold;
  reportProps.scatterThreshold = props.scatterThreshold;
  reportProps.treeThreshold = props.treeThreshold;
  reportProps.collapseMonotypic = props.collapseMonotypic;
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
    minDim /= reportProps.ratio;
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

export default compose(withTaxonomy)(Report);
