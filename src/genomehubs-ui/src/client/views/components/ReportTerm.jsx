import React, { memo, useEffect, useRef } from "react";

import Chip from "@mui/material/Chip";
import { compose } from "redux";
import withReportTerm from "../hocs/withReportTerm";

const ReportTerm = ({ reportTerm, setReportTerm }) => {
  return (
    <Chip
      label={reportTerm}
      variant={"outlined"}
      onClick={() => {}}
      onDelete={() => {
        setReportTerm(false);
      }}
    />
  );
};

export default compose(withReportTerm)(ReportTerm);
