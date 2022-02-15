// import { RadialChart } from "react-vis";
import React, { Fragment, useRef } from "react";

import Grid from "@material-ui/core/Grid";
import useResize from "../hooks/useResize";

const ReportEmpty = ({ report }) => {
  return (
    <Grid item xs style={{ height: "100%" }}>
      {`No ${report} data to display`}
    </Grid>
  );
};

export default ReportEmpty;
