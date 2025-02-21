import React, { useEffect, useRef, useState } from "react";

import Grid from "@mui/material/Grid2";
import PhylopicAttributions from "./PhylopicAttributions";
import Tooltip from "./Tooltip";
import { compose } from "recompose";
import { reportCaption as reportCaptionStyle } from "./Styles.scss";
import stringLength from "../functions/stringLength";
import useResize from "../hooks/useResize";
import withColors from "#hocs/withColors";
import withTheme from "#hocs/withTheme";

const ReportCaption = ({
  reportById,
  caption,
  embedded,
  inModal,
  padding = 0,
  colorScheme,
  theme,
}) => {
  const gridRef = useRef();
  const { width, height } = useResize(gridRef);
  const [captionScale, setCaptionScale] = useState(100);
  const textColor = colorScheme[theme].darkColor;

  const formatCaption = ({ caption, tooltip }) => {
    if (caption && caption !== true) {
      let captionArr = [];
      let parts = (caption || "").split("**");
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 == 0) {
          let units = parts[i].split(",");
          for (let j = 0; j < units.length; j++) {
            captionArr.push(
              <span key={i + j}>
                {units[j]}
                {j < units.length - 1 && ",\u200b"}
              </span>,
            );
          }
          // captionArr.push(<span key={i}>{parts[i]}</span>);
        } else {
          captionArr.push(
            <b
              key={i}
              style={{
                color: tooltip ? "yellow" : textColor,
              }}
            >
              {parts[i]}
            </b>,
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
      ratio = Math.max(Math.min(ratio, 135), 80);
      setCaptionScale(ratio);
    }
  }, [width]);

  const countRows = (arr) =>
    Math.floor(
      Math.ceil(
        (stringLength(arr.join(" ")) * 8 * captionScale) / 100 / width,
      ) * 1.5,
    );
  let displayCaption;
  if (!inModal) {
    let captionArr = caption.split(" ");
    while (captionArr.length > 1 && countRows(captionArr) > 2) {
      captionArr.pop();
    }
    displayCaption = captionArr.join(" ");
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
  } else {
    displayCaption = formatCaption({ caption });
  }

  let captionFooter;
  let { tree } = reportById.report;
  if (tree && tree.phylopics && Object.keys(tree.phylopics).length > 0) {
    captionFooter = (
      <PhylopicAttributions
        taxIds={tree.phylopics}
        showAncestral={false}
        fontSize={12}
        embed={false}
      />
    );
  }

  return (
    <Grid ref={gridRef} style={{ textAlign: "center" }} size="grow">
      <div style={{ width: "100%", maxHeight: "6em", overflowY: "auto" }}>
        <div
          className={reportCaptionStyle}
          style={{
            pointerEvents: "auto",
            ...(captionScale && {
              fontSize: `${captionScale}%`,
              marginTop: inModal ? "0.5em" : padding ? `${padding}px` : 0,
            }),
          }}
        >
          {displayCaption}
        </div>
        {captionFooter}
      </div>
    </Grid>
  );
};

export default compose(withTheme, withColors)(ReportCaption);
