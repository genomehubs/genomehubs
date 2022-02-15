import React, { memo, useEffect, useRef } from "react";

import Chip from "@material-ui/core/Chip";
import { compose } from "recompose";
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
