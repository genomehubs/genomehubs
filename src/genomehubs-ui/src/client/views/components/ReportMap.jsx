// import { RadialChart } from "react-vis";
import MultiCatLegend, { processLegendData } from "./MultiCatLegend";
import React, { Fragment, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "@reach/router";

import { compose } from "recompose";
import dispatchMessage from "../hocs/dispatchMessage";
import useResize from "../hooks/useResize";
import withColors from "../hocs/withColors";

const ReportMap = ({
  map,
  chartRef,
  containerRef,
  embedded,
  ratio,
  stacked,
  setMessage,
  colors,
  minDim,
  setMinDim,
  xOpts,
}) => {
  const navigate = useNavigate();
  const componentRef = chartRef ? chartRef : useRef();
  const { width, height } = containerRef
    ? useResize(containerRef)
    : useResize(componentRef);
  useEffect(() => {
    if (map && map.status) {
      setMessage(null);
    }
  }, [map]);
  if (map && map.status) {
    console.log(map);

    // return (
    //   <Grid item xs ref={componentRef} style={{ height: "100%" }}>
    //     {chart}
    //   </Grid>
    // );
  } else {
    return null;
  }
};

export default compose(dispatchMessage, withColors)(ReportMap);
