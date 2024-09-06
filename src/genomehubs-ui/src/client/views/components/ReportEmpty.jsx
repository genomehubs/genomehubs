import Grid from "@mui/material/Grid2";
import Logo from "./Logo";
// import { RadialChart } from "react-vis";
import React from "react";
import { compose } from "recompose";
import withColors from "../hocs/withColors";

const ReportEmpty = ({ report, statusColors, inModal }) => {
  return (
    (<Grid
      style={{
        height: "100%",
        background: statusColors.descendant + "cc",
        padding: "1em",
      }}
      size="grow"
    >
      {(inModal && (
        <>
          <div
            style={{
              padding: "1em",
              textAlign: "center",
            }}
          >{`No ${report} data to display`}</div>
        </>
      )) || (
        <>
          <div
            style={{
              position: "absolute",
              textAlign: "center",
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
              lineHeight: "3em",
              height: "3em",
              right: 0,
              bottom: 0,
              left: 0,
            }}
          >{`No ${report} data to display`}</div>
        </>
      )}
    </Grid>)
  );
};

export default compose(withColors)(ReportEmpty);
