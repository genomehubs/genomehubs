import React, { useEffect, useRef } from "react";

import Tooltip from "./Tooltip";
import { compose } from "recompose";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import { useNavigate } from "@reach/router";
import useResize from "../hooks/useResize";
import withSiteName from "../hocs/withSiteName";

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
  basename,
  containerRef,
  chartRef,
}) => {
  const componentRef = chartRef ? chartRef : useRef();
  const navigate = useNavigate();
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
    let maxValue = Math.max(0, ...perRank.report.xPerRank.map((o) => o.x));

    perRank.report.xPerRank.forEach((entry) => {
      if ((maxValue > 0 && entry.x) || true) {
        let plural =
          entry.x > 1 && ranks[entry.rank]
            ? ranks[entry.rank].plural
            : entry.rank;
        values.push(
          <Tooltip
            key={entry.rank}
            title={`Click to ${entry.x > 1 ? "list all" : "view"} ${plural}`}
            arrow
            placement={"top"}
          >
            <div
              key={entry.rank}
              style={{ cursor: "pointer" }}
              onClick={() =>
                navigate(`${basename}/search?${qs.stringify(entry.xQuery)}`)
              }
            >
              <span className={styles.boldValue}>
                {entry.x.toLocaleString()}
              </span>
              <span>{plural}</span>
            </div>
          </Tooltip>
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

export default compose(withSiteName)(ReportXPerRank);
