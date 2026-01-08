import React, { useState } from "react";

import JSONPretty from "react-json-pretty";
import JSONPrettyMon from "react-json-pretty/dist/monikai";
import { compose } from "redux";
import withReportById from "../hocs/withReportById";

export const ReportCode = ({ reportId, reportById, report, queryString }) => {
  if (!reportById.report || !reportById.report.queryString) {
    return null;
  }
  let code = reportById.report;
  if (code.tree) {
    let { lines, ...tree } = code.tree;
    code.tree = tree;
  }
  // TODO: filter processed data from report code
  return (
    <code style={{ textAlign: "left" }}>
      <JSONPretty
        id="json-pretty"
        theme={JSONPrettyMon}
        data={reportById.report}
      ></JSONPretty>
    </code>
  );
};

export default compose(withReportById)(ReportCode);
