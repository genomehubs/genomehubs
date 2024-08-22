import React, { Fragment, useLayoutEffect, useRef, useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Skeleton from '@mui/material/Skeleton';
import Typography from "@mui/material/Typography";
import { compose } from "recompose";
import makeStyles from '@mui/styles/makeStyles';
import useResize from "../hooks/useResize";
import useWindowDimensions from "../hooks/useWindowDimensions";
import withApi from "../hocs/withApi";

const StaticPlotFile = ({
  fileId,
  fileUrl,
  apiUrl,
  containerRef,
  ratio = 1,
  windowDimensions,
  previewDimensions,
  setPreviewDimensions,
}) => {
  const [src, setSrc] = useState(false);
  const [loading, setLoading] = useState(true);
  const { width, height } = useResize(containerRef);
  if (!fileId) {
    return null;
  }
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

    setSrc(
      // `${apiUrl}/download?recordId=${fileId}&streamFile=true&preview=true`
      `${apiUrl}/download?recordId=${fileId}&streamFile=true`
    );
  }
  return loading ? (
    <div
      style={{
        width: `${width}px`,
        height: `${width / ratio}px`,
      }}
    >
      <img
        onError={handleError}
        onLoad={handleLoad}
        style={{ display: "none" }}
        src={src}
      />
      <Skeleton variant="rectangular" width={width} height={width / ratio} />
    </div>
  ) : (
    <div>
      <img
        src={src}
        style={{
          width: `${width}px`,
          height: `${width / ratio}px`,
        }}
      />
    </div>
  );
};

export default compose(withApi)(StaticPlotFile);
