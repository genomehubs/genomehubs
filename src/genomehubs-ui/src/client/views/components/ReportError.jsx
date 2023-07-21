// import { RadialChart } from "react-vis";
import React, { Fragment, useRef } from "react";

import Grid from "@material-ui/core/Grid";
import { compose } from "recompose";
import withColors from "../hocs/withColors";

const ReportError = ({ report, error, statusColors }) => {
  if (error == "x_content_parse_exception") {
    error = "Error processing search query";
  }
  return (
    <Grid
      item
      xs
      style={{
        height: "100%",
        background: statusColors.ancestral + "33",
        padding: "1em",
      }}
    >
      {`Could not load ${report}`}
      <div>
        <pre>{error}</pre>
      </div>
    </Grid>
  );
};

export default compose(withColors)(ReportError);
