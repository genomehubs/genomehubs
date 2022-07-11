import React, { useEffect, useRef } from "react";

import Skeleton from "@material-ui/lab/Skeleton";
import Tooltip from "@material-ui/core/Tooltip";
import { compose } from "recompose";
import { formatter } from "../functions/formatter";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import { useNavigate } from "@reach/router";
import useVisible from "../hooks/useVisible";
import withLookup from "../hocs/withLookup";
import withSearch from "../hocs/withSearch";
import withSummary from "../hocs/withSummary";
import withSummaryById from "../hocs/withSummaryById";
import withTaxonomy from "../hocs/withTaxonomy";

const HistogramSVG = ({
  summaryId,
  sequence = 0,
  scientific_name,
  summaryById,
  fetchSummary,
  searchIndex,
  fetchSearchResults,
  taxonomy,
  setPreferSearchTerm,
  setLookupTerm,
}) => {
  const navigate = useNavigate();

  const height = 100;
  const targetRef = useRef(null);
  let visible = useVisible(targetRef);
  let parts = summaryId.split("--");
  useEffect(() => {
    let mounted = true;
    let fetchTimeout;
    if (summaryId && visible) {
      fetchTimeout = setTimeout(() => {
        if (mounted) {
          fetchSummary(parts[0], parts[1], parts[2], parts[3], searchIndex);
        }
      }, sequence * 100);
    }
    return () => {
      mounted = false;
      clearTimeout(fetchTimeout);
    };
  }, [summaryId, visible]);
  const handleClick = (bucket) => {
    let query = `tax_tree(${parts[0]})`;
    if (bucket.hasOwnProperty("min")) {
      query += ` AND ${parts[1]}>=${bucket.min}`;
    }
    if (bucket.hasOwnProperty("max")) {
      query += ` AND ${parts[1]}<${bucket.max}`;
    }
    updateSearch({
      query,
      searchRawValues: true,
      includeEstimates: false,
      summaryValues: "count",
      result: "taxon",
      taxonomy,
    });
  };
  const updateSearch = (options) => {
    let hashTerm = encodeURIComponent(options.query) || "";
    setPreferSearchTerm(false);
    setLookupTerm(hashTerm);
    navigate(`/search?${qs.stringify(options)}#${hashTerm}`);
  };
  let buckets = [];
  let ticks = [];
  if (summaryById && summaryById.buckets) {
    buckets = summaryById.buckets;
    ticks = summaryById.ticks;
  }
  if (buckets.length > 0 && summaryById.max == 0) {
    return (
      <svg
        viewBox={"0 0 1000 25"}
        preserveAspectRatio="xMinYMin"
        ref={targetRef}
      >
        <text
          style={{ fontSize: "12px" }}
          x={1000 / 2}
          y={25 / 2}
          fillOpacity={0.5}
          textAnchor="middle"
          alignmentBaseline="central"
        >
          no data
        </text>
      </svg>
    );
  }
  if (buckets.length == 0) {
    let scale = 0.75;
    return (
      <div className={styles.fullWidth} ref={targetRef}>
        <div
          style={{
            transform: `translate(25px, 10px) scale(${scale})`,
            transformOrigin: "left top",
          }}
        >
          <Skeleton variant="rect" width={1000} height={height} />
        </div>
      </div>
    );
  }
  let histogramRects = [];
  let histogramText = [];
  let histogramTicks = [];
  let histogramTickLabels = [];
  buckets.forEach((bucket, i) => {
    histogramRects.push(
      <Tooltip
        key={bucket.bin}
        title={"Click to find records in this bin"}
        arrow
      >
        <rect
          key={bucket.bin}
          x={bucket.x}
          y={0}
          width={bucket.width}
          height={height}
          fill={bucket.color}
          style={{ cursor: "pointer", pointerEvents: "auto" }}
          onClick={() => handleClick(bucket)}
        />
      </Tooltip>
    );
    histogramText.push(
      <text
        key={bucket.bin}
        style={{
          fontSize: "24px",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
        x={bucket.x + bucket.width / 2}
        y={height / 2}
        fill={"white"}
        textAnchor="middle"
        alignmentBaseline="central"
      >
        {formatter(bucket.count)}
      </text>
    );
  });
  ticks.forEach((tick, i) => {
    histogramTicks.push(
      <line
        key={tick.value}
        x1={tick.x}
        y1={height}
        x2={tick.x}
        y2={height + 5}
        stroke={"currentColor"}
        strokeWidth={1}
        opacity={0.75}
      >
        {tick.value}
      </line>
    );
    histogramTickLabels.push(
      <text
        key={tick.value}
        style={{ fontSize: "14px" }}
        x={tick.x}
        y={height + 5}
        fill={"currentColor"}
        textAnchor={"middle"}
        alignmentBaseline={"hanging"}
        opacity={0.75}
      >
        {tick.value}
      </text>
    );
  });
  return (
    <svg
      viewBox={"-25 -10 1050 135"}
      preserveAspectRatio="xMinYMin"
      ref={targetRef}
      style={{ pointerEvents: "none" }}
    >
      <g>{histogramTicks}</g>
      <g>{histogramRects}</g>
      <g>{histogramText}</g>
      <rect
        x={0}
        y={0}
        width={1000}
        height={height}
        fill={"none"}
        stroke={"black"}
        strokeWidth={1}
      />
      <g>{histogramTickLabels}</g>
    </svg>
  );
};

export default compose(
  withTaxonomy,
  withLookup,
  withSearch,
  withSummary,
  withSummaryById
)(HistogramSVG);
