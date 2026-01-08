import React, { useState } from "react";
import {
  blackToAncestral as blackToAncestralStyle,
  blackToDescendant as blackToDescendantStyle,
  blackToDirect as blackToDirectStyle,
  blackToPrimary as blackToPrimaryStyle,
} from "./Styles.scss";

import Skeleton from "@mui/material/Skeleton";
import { compose } from "redux";
import withApi from "../hocs/withApi";

const styleMap = {
  blackToAncestralStyle,
  blackToDescendantStyle,
  blackToDirectStyle,
  blackToPrimaryStyle,
};

const PhyloPic = ({
  fileUrl,
  source = "Primary",
  ratio = 1,
  fixedRatio,
  maxHeight = 100,
}) => {
  const [src, setSrc] = useState(false);
  const [loading, setLoading] = useState(true);
  const width = 300;

  let imageWidth = fixedRatio
    ? maxHeight * ratio
    : Math.min(maxHeight * ratio, width);
  const handleLoad = () => {
    setLoading(false);
  };
  const handleError = () => {
    if (loading != "retry") {
      if (fileUrl) {
        setSrc(fileUrl);
      }
      setLoading("retry");
    } else {
      setLoading("error");
      console.log("failed to load image");
    }
  };
  if (!src) {
    setSrc(fileUrl);
  }
  return loading && 0 ? (
    <div
      style={{
        width: `${imageWidth}px`,
        height: `${imageWidth / ratio}px`,
      }}
    >
      <img
        onError={handleError}
        onLoad={handleLoad}
        style={{
          display: "none",
        }}
        src={src}
      />
      <Skeleton
        variant="rectangular"
        width={imageWidth}
        height={imageWidth / ratio}
      />
    </div>
  ) : (
    <div>
      <img
        src={src}
        className={styleMap[`blackTo${source}Style`]}
        style={{
          width: `${imageWidth}px`,
          maxWidth: "100%",
          maxHeight: "100%",
          // height: `${width / ratio}px`,
        }}
      />
    </div>
  );
};

export default compose(withApi)(PhyloPic);
