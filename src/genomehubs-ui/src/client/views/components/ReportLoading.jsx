// import { RadialChart } from "react-vis";
import React, { Fragment, useRef } from "react";

import Grid from "@mui/material/Grid2";
import Skeleton from "@mui/material/Skeleton";
import { useEffect } from "react";
import useResize from "../hooks/useResize";

const ReportLoading = ({
  report,
  chartRef,
  containerRef,
  ratio,
  minDim,
  setMinDim,
  loading,
  content,
}) => {
  const componentRef = chartRef || useRef();
  const { width, height } = containerRef
    ? useResize(containerRef)
    : useResize(componentRef);
  useEffect(() => {
    let newMinDim;
    if (height) {
      newMinDim = Math.floor(Math.min(width, height));
    } else if (width) {
      newMinDim = Math.floor(width) / ratio;
    }
    if (newMinDim) {
      setMinDim(newMinDim);
    }
  }, [width, height]);
  return (
    (<Grid
      style={{
        height: "100%",
        width: "100%",
        // minWidth: minDim * ratio,
        minHeight: minDim,
        position: "relative",
      }}
      ref={componentRef}
      size="grow"
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: "0 auto",
        }}
      >
        {loading && (
          <Skeleton
            variant="rectangular"
            width={minDim * ratio}
            height={minDim}
          />
        )}
      </div>
      <div
        id="report-loaded"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {content}
      </div>
    </Grid>)
  );
};

export default ReportLoading;
