import Grid from "@material-ui/core/Grid";
// import { RadialChart } from "react-vis";
import React from "react";
import { compose } from "recompose";
import withColors from "../hocs/withColors";

const ReportEmpty = ({ report, statusColors }) => {
  return (
    <Grid
      item
      xs
      style={{
        height: "100%",
        background: statusColors.descendant + "33",
        padding: "1em",
      }}
    >
      {`No ${report} data to display`}
    </Grid>
  );
};

export default compose(withColors)(ReportEmpty);
