// import { RadialChart } from "react-vis";
import React, { Fragment, useRef } from "react";

import Grid from "@material-ui/core/Grid";
import Skeleton from "@material-ui/lab/Skeleton";
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
  const componentRef = chartRef ? chartRef : useRef();
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
    <Grid
      item
      xs
      style={{
        height: "100%",
        width: "100%",
        // minWidth: minDim * ratio,
        minHeight: minDim,
        position: "relative",
        background: "#99999999",
      }}
      ref={componentRef}
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
          <Skeleton variant="rect" width={minDim * ratio} height={minDim} />
        )}
      </div>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "#999999ff99",
        }}
      >
        {content}
      </div>
    </Grid>
  );
};

export default ReportLoading;
