import React, { useEffect, useRef } from "react";

import Skeleton from "@material-ui/lab/Skeleton";
import { TagCloud } from "react-tagcloud";
import { compose } from "recompose";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import { useNavigate } from "@reach/router";
import useVisible from "../hooks/useVisible";
import withLookup from "../hocs/withLookup";
import withSearch from "../hocs/withSearch";
import withSiteName from "../hocs/withSiteName";
import withSummary from "../hocs/withSummary";
import withSummaryById from "../hocs/withSummaryById";
import withTaxonomy from "../hocs/withTaxonomy";

const WordCloud = ({
  summaryId,
  sequence = 0,
  scientific_name,
  summaryById,
  fetchSummary,
  searchIndex,
  fetchSearchResults,
  setPreferSearchTerm,
  setLookupTerm,
  // resetLookup,
  taxonomy,
  basename,
}) => {
  const navigate = useNavigate();
  const height = 100;
  const targetRef = useRef();
  let visible = useVisible(targetRef);
  let parts = summaryId.split("--");
  useEffect(() => {
    if (summaryId && visible) {
      setTimeout(() => {
        fetchSummary(parts[0], parts[1], parts[2], parts[3], searchIndex);
      }, sequence * 100);
    }
  }, [summaryId, visible]);
  const handleClick = (bucket) => {
    let query = `tax_tree(${parts[0]}) AND ${parts[1]}=${bucket.value}`;
    updateSearch({
      query,
      searchRawValues: true,
      includeEstimates: false,
      summaryValues: "count",
      result: "taxon",
      taxonomy,
    });
  };
  // const updateSearch = (options) => {
  //   // fetchSearchResults(options);
  //   setPreferSearchTerm(false);
  //   navigate(
  //     `${basename}/search?${qs.stringify(options)}#${encodeURIComponent(
  //       options.query
  //     )}`
  //   );
  //   // resetLookup();
  // };
  const updateSearch = (options) => {
    let hashTerm = encodeURIComponent(options.query) || "";
    setPreferSearchTerm(false);
    setLookupTerm(hashTerm);
    navigate(`${basename}/search?${qs.stringify(options)}#${hashTerm}`);
  };
  let buckets = [];
  if (summaryById && summaryById.buckets) {
    buckets = summaryById.buckets;
    if (buckets.length == 0) {
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
            dominantBaseline="alphabetic"
            pointerEvents={"none"}
          >
            no data
          </text>
        </svg>
      );
    }
  }

  if (buckets.length == 0) {
    return (
      <div className={styles.fullWidth} ref={targetRef}>
        <Skeleton variant="rect" width={400} height={50} />
      </div>
    );
  }
  return (
    <div ref={targetRef}>
      <TagCloud
        className={styles.tagCloud}
        minSize={12}
        maxSize={35}
        tags={buckets}
        disableRandomColor
        onClick={handleClick}
      />
    </div>
  );
};

export default compose(
  withSiteName,
  withTaxonomy,
  withLookup,
  withSearch,
  withSummary,
  withSummaryById
)(WordCloud);
