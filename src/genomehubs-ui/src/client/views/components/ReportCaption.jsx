import React, { useEffect, useRef, useState } from "react";

import Grid from "@material-ui/core/Grid";
import stringLength from "../functions/stringLength";
import styles from "./Styles.scss";
import useResize from "../hooks/useResize";

const ReportCaption = ({ caption, embedded }) => {
  const gridRef = useRef();
  const { width, height } = useResize(gridRef);
  const [captionScale, setCaptionScale] = useState();

  const formatCaption = (caption) => {
    if (caption && caption !== true) {
      let captionArr = [];
      let parts = (caption || "").split("**");
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 == 0) {
          captionArr.push(<span key={i}>{parts[i]}</span>);
        } else {
          captionArr.push(
            <b key={i} style={{ color: "black" }}>
              {parts[i]}
            </b>
          );
        }
      }
      return <span>{captionArr}</span>;
    }
    return;
  };

  let captionLength = stringLength(caption) * 10;
  if (captionLength > width * 1.8 && caption.length > width / 2.9) {
    caption = caption.slice(0, width / 3) + "...";
  }
  let formattedCaption = formatCaption(caption);

  useEffect(() => {
    if (typeof embedded !== "undefined" && captionLength < width * 1.8) {
      let ratio = ((width * 1.8) / captionLength) * 100;
      ratio = Math.max(Math.min(ratio, 180), 80);
      setCaptionScale(ratio);
    }
  }, [width]);

  return (
    <Grid ref={gridRef} item xs style={{ textAlign: "center" }}>
      <div
        className={styles.reportCaption}
        style={{
          ...(captionScale && {
            fontSize: `${captionScale}%`,
            marginTop: "1em",
          }),
        }}
      >
        {formattedCaption}
      </div>
    </Grid>
  );
};

export default ReportCaption;
