import React, { useEffect, useRef } from "react";

import styles from "./Styles.scss";
import useResize from "../hooks/useResize";

const ranks = {
  superkingdom: { plural: "superkingdoms" },
  kingdom: { plural: "kingdoms" },
  phylum: { plural: "phyla" },
  class: { plural: "classes" },
  order: { plural: "orders" },
  family: { plural: "families" },
  genus: { plural: "genera" },
  species: { plural: "species" },
  subspecies: { plural: "subspecies" },
};

const ReportXPerRank = ({
  perRank,
  minDim,
  setMinDim,
  containerRef,
  chartRef,
}) => {
  const componentRef = chartRef ? chartRef : useRef();
  const { width } = containerRef
    ? useResize(containerRef)
    : useResize(componentRef);
  let values = [];
  let ranks = [];
  if (perRank && perRank.status) {
    useEffect(() => {
      let height = perRank.report.xPerRank.length * 27;
      let ratio = 400 / height;
      if (ratio != minDim / 400) {
        if (width > 0) {
          setMinDim(height);
        }
      }
    }, [width]);

    perRank.report.xPerRank.forEach((entry) => {
      if (entry.x) {
        let plural =
          entry.x != 1 && ranks[entry.rank]
            ? ranks[entry.rank].plural
            : entry.rank;
        values.push(
          <div key={entry.rank}>
            <span className={styles.boldValue}>{entry.x.toLocaleString()}</span>
            <span>{plural}</span>
          </div>
        );
      }
    });
  } else {
    return null;
  }
  return (
    <div style={{ textAlign: "center" }} ref={componentRef}>
      <div style={{ display: "inline-block", textAlign: "left" }}>{values}</div>
    </div>
  );
};

export default ReportXPerRank;
