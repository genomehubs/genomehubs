import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "@reach/router";

import Grid from "@material-ui/core/Grid";
import LaunchIcon from "@material-ui/icons/Launch";
import ReportTreePaths from "./ReportTreePaths";
import ReportTreeRings from "./ReportTreeRings";
import Tooltip from "@material-ui/core/Tooltip";
import { compose } from "recompose";
import dispatchReport from "../hocs/dispatchReport";
import qs from "qs";
import styles from "./Styles.scss";
import useResize from "../hooks/useResize";
import withReportById from "../hocs/withReportById";

const ReportTree = ({
  reportId,
  tree,
  chartRef,
  containerRef,
  reportRef,
  gridRef,
  ratio,
  hidePreview,
  fetchReport,
  topLevel,
  permaLink,
  treeStyle,
  levels,
  minDim,
  setMinDim,
}) => {
  const navigate = useNavigate();
  const componentRef = chartRef ? chartRef : useRef();
  const { width, height } = containerRef
    ? useResize(containerRef)
    : useResize(componentRef);
  // useEffect(() => {
  //   let newMinDim;
  //   if (height) {
  //     newMinDim = Math.floor(Math.min(width, height));
  //   } else if (width) {
  //     newMinDim = Math.floor(width) / ratio;
  //   }
  //   if (newMinDim) {
  //     setMinDim(newMinDim);
  //   }
  // }, [width, height]);
  if (!tree.report) return null;
  let maxDepth = tree.report.tree.maxDepth;
  let queryObj = qs.parse(tree.report.queryString);
  const updateQuery = ({ root, name, depth, rank }) => {
    let { query, x, ...options } = tree.report.xQuery;
    if (query && !x) {
      x = query;
    }
    let y = queryObj.y;
    if (root) {
      if (x.match("tax_tree")) {
        x = x.replace(/tax_tree\(\w+?\)/, `tax_tree(${root})`);
      } else {
        x += ` AND tax_tree(${root})`;
      }
    }
    if (x.match("tax_depth")) {
      if (maxDepth > tree.report.tree.maxDepth) {
        maxDepth = tree.report.tree.maxDepth;
      }
      x = x.replace(/tax_depth\(\d+\)/, `tax_depth(${maxDepth})`);
      if (y) {
        y = y.replace(/tax_depth\(\d+\)/, `tax_depth(${maxDepth})`);
      }
    }
    if (depth != 0 && levels) {
      let taxRank = x.match(/tax_rank\((\w+)\)/);
      if (taxRank) {
        taxRank = taxRank[1].toLowerCase();
        let ranks = levels.toLowerCase().split(/(?:,\s*)/);
        let index = ranks.indexOf(taxRank);
        let newRank = taxRank;
        if (index >= 0) {
          if (depth < 0 && index < ranks.length - 1) {
            newRank = ranks[index + 1];
          } else if (depth > 0 && index > 0) {
            newRank = ranks[index - 1];
          }
        }
        x = x.replace(/tax_rank\(\w+\)/, `tax_rank(${newRank})`);
        if (y) {
          y = y.replace(/tax_rank\(\w+\)/, `tax_rank(${newRank})`);
        }
      }
    }
    let fields = tree.report.tree.xQuery.fields;

    return { ...queryObj, fields, x, y, options };
  };

  // const handleNavigation = ({ root, name }) => {
  //   let newQuery = updateQuery({ root, name });
  //   let newQueryString = qs.stringify(newQuery);
  //   if (topLevel) {
  //     fetchReport({ reportId, queryString: newQueryString, reload: true });
  //   } else {
  //     permaLink(newQueryString);
  //   }
  // };

  const handleSearch = ({ root, name, depth, rank }) => {
    let { options, y, report, x, fields, ...moreOptions } = updateQuery({
      root,
      name,
      depth,
      rank,
    });
    let query;
    let hash;
    // if (location.pathname == "/report") {
    //   hash = x;
    // } else {
    query = x;
    hash = query;
    x = undefined;
    // }

    if (name != "parent") {
      hash = hash.replace(new RegExp("\\(" + root + "\\)"), `(${name})`);
    }

    navigate(
      `/search?${qs.stringify({
        ...options,
        ...moreOptions,
        query,
        fields,
        report: "tree",
        x,
        y,
      })}#${encodeURIComponent(hash)}`
    );
  };

  const handleNavigation = ({ root, name, depth, rank }) => {
    if (name == "parent") {
      handleSearch({ root, name, depth, rank });
      return;
    }
    let { result, taxonomy } = queryObj;

    navigate(
      `/records?${qs.stringify({
        record_id: root,
        taxonomy,
        result,
      })}#${encodeURIComponent(name)}`
    );
  };

  let treeComponent;
  if (treeStyle == "ring") {
    treeComponent = (
      <ReportTreeRings
        width={width}
        height={minDim - 50}
        {...tree.report.tree}
        handleNavigation={handleNavigation}
        handleSearch={handleSearch}
      />
    );
  } else {
    treeComponent = (
      <ReportTreePaths
        width={width}
        height={minDim - 50}
        {...tree.report.tree}
        handleNavigation={handleNavigation}
        handleSearch={handleSearch}
        containerRef={containerRef}
        reportRef={reportRef}
        gridRef={gridRef}
        hidePreview={hidePreview}
      />
    );
  }
  return (
    <Grid item xs ref={componentRef} style={{ height: "100%" }}>
      {treeComponent}
    </Grid>
  );
};

export default compose(dispatchReport, withReportById)(ReportTree);
