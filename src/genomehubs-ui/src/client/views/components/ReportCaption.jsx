import React, { useEffect, useRef, useState } from "react";

import Grid from "@material-ui/core/Grid";
import Tooltip from "./Tooltip";
import stringLength from "../functions/stringLength";
import styles from "./Styles.scss";
import useResize from "../hooks/useResize";

const ReportCaption = ({ caption, embedded, inModal }) => {
  const gridRef = useRef();
  const { width, height } = useResize(gridRef);
  const [captionScale, setCaptionScale] = useState(100);

  const formatCaption = ({ caption, tooltip }) => {
    if (caption && caption !== true) {
      let captionArr = [];
      let parts = (caption || "").split("**");
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 == 0) {
          captionArr.push(<span key={i}>{parts[i]}</span>);
        } else {
          captionArr.push(
            <b key={i} style={{ color: tooltip ? "yellow" : "black" }}>
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

  useEffect(() => {
    if (typeof embedded !== "undefined" && captionLength < width * 1.8) {
      let ratio = ((width * 1.8) / captionLength) * 100;
      ratio = Math.max(Math.min(ratio, 180), 80);
      setCaptionScale(ratio);
    }
  }, [width]);

  const countRows = (arr) =>
    Math.floor(
      Math.ceil(
        (stringLength(arr.join(" ")) * 8 * captionScale) / 100 / width
      ) * 1.5
    );

  let captionArr = caption.split(" ");
  while (captionArr.length > 1 && countRows(captionArr) > 2) {
    captionArr.pop();
  }
  let displayCaption = captionArr.join(" ");
  if (displayCaption.length < caption.length - 3) {
    displayCaption += "...";
    displayCaption = (
      <Tooltip title={formatCaption({ caption, tooltip: true })} arrow>
        {formatCaption({ caption: displayCaption })}
      </Tooltip>
    );
  } else {
    displayCaption = formatCaption({ caption: displayCaption });
  }

  return (
    <Grid ref={gridRef} item xs style={{ textAlign: "center" }}>
      <div
        className={styles.reportCaption}
        style={{
          pointerEvents: "auto",
          ...(captionScale && {
            fontSize: `${captionScale}%`,
            marginTop: inModal ? "1em" : 0,
          }),
        }}
      >
        {displayCaption}
      </div>
    </Grid>
  );
};

export default ReportCaption;
