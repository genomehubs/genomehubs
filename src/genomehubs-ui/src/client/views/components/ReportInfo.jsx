import Grid from "@mui/material/Grid";
import React from "react";
import ReportLegend from "./ReportLegend";
import { compose } from "redux";
import withReportById from "#hocs/withReportById";

export const ReportInfo = ({ reportById, report }) => {
  if (!reportById.report || !reportById.report[report]) {
    return null;
  }

  let { caption } = reportById.report;
  return (
    <Grid
      container
      direction="column"
      style={{ height: "100%", width: "100%" }}
      spacing={2}
    >
      <Grid>{caption}</Grid>
      <Grid>
        <ReportLegend reportById={reportById} report={report} />
      </Grid>
    </Grid>
  );
};

export default compose(withReportById)(ReportInfo);
