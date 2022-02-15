import Grid from "@material-ui/core/Grid";
import React from "react";
import { compose } from "recompose";
import withColors from "../hocs/withColors";
import withReportById from "../hocs/withReportById";

export const ReportLegend = ({ reportById, report, colors }) => {
  if (!reportById.report || !reportById.report[report]) {
    return null;
  }

  let legend;

  const LegendEntry = ({ obj, color }) => {
    return (
      <Grid item>
        <Grid container direction="row">
          <Grid item xs={1}></Grid>
          <Grid item xs={1}>
            <div
              style={{
                height: "1.5em",
                width: "1.5em",
                borderRadius: "0.75em",
                backgroundColor: color,
              }}
            />
          </Grid>
          <Grid item>{obj.label}</Grid>
          <Grid item style={{ marginLeft: "auto" }}>
            {obj.doc_count}
          </Grid>
          <Grid item xs={1}></Grid>
        </Grid>
      </Grid>
    );
  };
  if (reportById.report[report].bounds) {
    let { cat, cats, stats, showOther } = reportById.report[report].bounds;
    if (cat) {
      let other = [];
      if (showOther) {
        let otherCount =
          stats.count -
          cats.reduce((a, b) => ({ doc_count: a.doc_count + b.doc_count }))
            .doc_count;
        other = (
          <LegendEntry
            obj={{ label: "other", doc_count: otherCount }}
            color={colors[cats.length]}
            key={"other"}
          />
        );
      }
      legend = (
        <Grid container direction="column" spacing={2}>
          <Grid item>{cat}</Grid>
          {cats
            .map((obj, i) => (
              <LegendEntry obj={obj} color={colors[i]} key={obj.key} />
            ))
            .concat(other)}
        </Grid>
      );
    }
  }
  return (
    <Grid
      container
      direction="column"
      style={{ height: "100%", width: "100%" }}
    >
      {legend}
    </Grid>
  );
};

export default compose(withReportById, withColors)(ReportLegend);
