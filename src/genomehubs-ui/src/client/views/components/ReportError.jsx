// import { RadialChart } from "react-vis";
import React, { Fragment, useRef } from "react";

import Grid from "@material-ui/core/Grid";
import Logo from "./Logo";
import { compose } from "recompose";
import withColors from "../hocs/withColors";

const ReportError = ({ report, error, statusColors, inModal }) => {
  if (error == "x_content_parse_exception") {
    error = "Error processing search query";
  }
  return (
    <Grid
      item
      xs
      style={{
        height: "100%",
        background: statusColors.ancestral + "cc",
        padding: "1em",
      }}
    >
      {(inModal && (
        <>
          <div>{`Could not load ${report}`}</div>
          <div>
            <pre>{error}</pre>
          </div>
        </>
      )) || (
        <>
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
          >
            <Logo />
          </div>
          <div
            style={{
              position: "absolute",
              background: "#ffffffcc",
              textAlign: "center",
              padding: "1em",
              right: 0,
              top: 0,
              left: 0,
            }}
          >
            <pre>{error}</pre>
          </div>
          <div
            style={{
              position: "absolute",
              background: "#ffffffcc",
              textAlign: "center",
              lineHeight: "3em",
              height: "3em",
              right: 0,
              bottom: 0,
              left: 0,
            }}
          >
            {`Could not load ${report}`}
          </div>
        </>
      )}
    </Grid>
  );
};

export default compose(withColors)(ReportError);
