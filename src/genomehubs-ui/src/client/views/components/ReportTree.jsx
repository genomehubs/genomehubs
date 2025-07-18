import React, { useEffect, useRef } from "react";

import Grid from "@mui/material/Grid2";
import ReportTreePaths from "./ReportTreePaths";
import ReportTreeRings from "./ReportTreeRings";
import { compose } from "recompose";
import dispatchReport from "../hocs/dispatchReport";
import qs from "../functions/qs";
import { useNavigate } from "@reach/router";
import useResize from "../hooks/useResize";
import withReportById from "../hocs/withReportById";
import withSiteName from "#hocs/withSiteName";

const ReportTree = ({
  tree,
  embedded,
  inModal,
  chartRef,
  containerRef,
  reportRef,
  gridRef,
  ratio,
  hidePreview,
  pointSize,
  treeStyle,
  levels,
  hideSourceColors,
  hideErrorBars,
  hideAncestralBars,
  showPhyloPics,
  phylopicRank,
  phylopicSize,
  minDim,
  setMinDim,
  basename,
}) => {
  const navigate = useNavigate();
  const componentRef = chartRef || useRef();
  const { width, height } = containerRef
    ? useResize(containerRef)
    : useResize(componentRef);

  const setDimensions = ({ width, height, timer }) => {
    let plotWidth = width;
    let plotHeight = inModal ? height : plotWidth / ratio;

    if (timer && plotHeight != height) {
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
    ({ plotWidth, plotHeight, dimensionTimer } = setDimensions({
      width,
      height,
      timer: true,
    }));
    return () => {
      clearTimeout(dimensionTimer);
    };
  }, [width]);
  if (!tree.report) {
    return null;
  }
  let { maxDepth } = tree.report.tree;
  let queryObj = qs.parse(tree.report.queryString);
  const updateQuery = ({ root, name, depth, rank, rootRank }) => {
    let { query, x, ...options } = tree.report.xQuery;
    if (query && !x) {
      x = query;
    }
    let { y } = queryObj;
    if (root) {
      if (x.match("tax_tree")) {
        x = x.replace(/tax_tree\([\w\[\]]+?\)/, `tax_tree(${root})`);
      } else {
        x += ` AND tax_tree(${root})`;
      }
    }
    if (x.match("tax_depth")) {
      maxDepth = Math.min(maxDepth, tree.report.tree.maxDepth);
      x = x.replace(/tax_depth\(\d+\)/, `tax_depth(${maxDepth})`);
      if (y) {
        y = y.replace(/tax_depth\(\d+\)/, `tax_depth(${maxDepth})`);
      }
    }
    if (depth != 0 && levels) {
      let taxRank = x.match(/tax_rank\((\w+)\)/);
      if (taxRank) {
        taxRank = taxRank[1].toLowerCase();
        let newRank = taxRank;
        let ranks = levels.toLowerCase().split(/(?:,\s*)/);
        let index = ranks.indexOf(taxRank);
        if (depth < 0) {
          let rootIndex = ranks.indexOf(rootRank);
          if (
            rootIndex > 0 &&
            index > 0 &&
            index < ranks.length - 1 &&
            newRank != rootRank
          ) {
            newRank = ranks[index + 1];
          }
        } else if (index > 0) {
          newRank = ranks[index - 1];
        }
        x = x.replace(/tax_rank\(\w+\)/, `tax_rank(${newRank})`);
        if (y) {
          y = y.replace(/tax_rank\(\w+\)/, `tax_rank(${newRank})`);
        }
      }
    }
    let { fields } = tree.report.tree.xQuery;

    return { ...queryObj, fields, x, y, options };
  };

  const handleSearch = ({ root, name, depth, rank, rootRank }) => {
    if (embedded) {
      return;
    }
    let { options, y, report, x, fields, ...moreOptions } = updateQuery({
      root,
      name,
      depth,
      rank,
      rootRank,
    });
    let query;
    let hash;
    query = x;
    hash = query;
    x = undefined;

    if (name != "parent") {
      hash = hash.replace(new RegExp("\\(" + root + "\\)"), `(${name})`);
    }

    navigate(
      `${basename}/search?${qs.stringify({
        ...options,
        ...moreOptions,
        query,
        fields,
        report: "tree",
        x,
        y,
      })}#${encodeURIComponent(hash)}`,
    );
  };

  const handleNavigation = ({ root, name, depth, rank, rootRank }) => {
    if (embedded) {
      return;
    }
    if (name == "parent") {
      handleSearch({ root, name, depth, rank, rootRank });
      return;
    }
    let { result, taxonomy } = queryObj;

    navigate(
      `${basename}/record?${qs.stringify({
        recordId: root,
        taxonomy,
        result,
      })}#${encodeURIComponent(name)}`,
    );
  };

  let treeComponent;
  if (treeStyle == "ring") {
    treeComponent = (
      <ReportTreeRings
        width={plotWidth}
        height={plotHeight}
        {...tree.report.tree}
        handleNavigation={handleNavigation}
        handleSearch={handleSearch}
        pointSize={pointSize}
        hideSourceColors={hideSourceColors}
        hideErrorBars={hideErrorBars}
        hideAncestralBars={hideAncestralBars}
        showPhylopics={showPhyloPics}
        phylopicRank={phylopicRank}
        phylopicSize={phylopicSize}
      />
    );
  } else {
    treeComponent = (
      <ReportTreePaths
        width={plotWidth}
        height={plotHeight}
        {...tree.report.tree}
        handleNavigation={handleNavigation}
        handleSearch={handleSearch}
        containerRef={containerRef}
        reportRef={reportRef}
        gridRef={gridRef}
        hidePreview={hidePreview}
        pointSize={pointSize}
        hideSourceColors={hideSourceColors}
        hideErrorBars={hideErrorBars}
        hideAncestralBars={hideAncestralBars}
        showPhylopics={showPhyloPics}
        phylopicRank={phylopicRank}
        phylopicSize={phylopicSize}
      />
    );
  }
  return (
    <Grid ref={componentRef} style={{ height: "100%" }} size="grow">
      {treeComponent}
    </Grid>
  );
};

export default compose(
  withSiteName,
  dispatchReport,
  withReportById,
)(ReportTree);
