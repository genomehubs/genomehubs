import React, { Fragment, useLayoutEffect, useRef, useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Skeleton from '@mui/material/Skeleton';
import Typography from "@mui/material/Typography";
import { compose } from "recompose";
import makeStyles from '@mui/styles/makeStyles';
import styles from "./Styles.scss";
import useResize from "../hooks/useResize";
import useWindowDimensions from "../hooks/useWindowDimensions";
import withApi from "../hocs/withApi";

const PhyloPic = ({
  fileId,
  fileUrl,
  source = "Primary",
  apiUrl,
  containerRef,
  ratio = 1,
  fixedRatio,
  windowDimensions,
  previewDimensions,
  setPreviewDimensions,
  maxHeight = 100,
}) => {
  const [src, setSrc] = useState(false);
  const [loading, setLoading] = useState(true);
  // const { width, height } = useResize(containerRef);
  const width = 300;

  let imageWidth = fixedRatio
    ? maxHeight * ratio
    : Math.min(maxHeight * ratio, width);
  // if (!fileId) {
  //   return null;
  // }
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
    // let [width, height] = meta.size_pixels.split("x");
    // let ratio = height / width;
    // let modalWidth = windowDimensions.width * 0.6;
    // let modalHeight = windowDimensions.height * 0.6;
    // if (width / height > modalWidth / modalHeight) {
    //   let imgWidth = Math.min(width, modalWidth);
    //   setPreviewDimensions({ width: imgWidth, height: imgWidth * ratio });
    // } else {
    //   let imgHeight = Math.min(height, modalHeight);
    //   setPreviewDimensions({ width: imgHeight / ratio, height: imgHeight });
    // }

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
      <Skeleton variant="rectangular" width={imageWidth} height={imageWidth / ratio} />
    </div>
  ) : (
    <div>
      <img
        src={src}
        className={styles[`blackTo${source}`]}
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
