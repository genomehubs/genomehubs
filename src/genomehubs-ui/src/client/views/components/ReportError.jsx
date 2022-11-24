// import { RadialChart } from "react-vis";
import React, { Fragment, useRef } from "react";

import Grid from "@material-ui/core/Grid";
import useResize from "../hooks/useResize";

const ReportError = ({ report, error }) => {
  if (error == "x_content_parse_exception") {
    error = "Error processing search query";
  }
  return (
    <Grid item xs style={{ height: "100%" }}>
      {`Could not load ${report}`}
      <div>
        <pre>{error}</pre>
      </div>
    </Grid>
  );
};

export default ReportError;
