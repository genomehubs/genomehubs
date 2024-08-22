import Grid from "@mui/material/Grid";
import React from "react";
import ReportLegend from "./ReportLegend";
import { compose } from "recompose";
import withReportById from "../hocs/withReportById";

export const ReportInfo = ({ reportById, report }) => {
  if (!reportById.report || !reportById.report[report]) {
    return null;
  }

  let caption = reportById.report.caption;
  return (
    <Grid
      container
      direction="column"
      style={{ height: "100%", width: "100%" }}
      spacing={2}
    >
      <Grid item>{caption}</Grid>
      <Grid item>
        <ReportLegend reportById={reportById} report={report} />
      </Grid>
    </Grid>
  );
};

export default compose(withReportById)(ReportInfo);
