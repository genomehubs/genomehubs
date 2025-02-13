import React, { memo, useRef } from "react";
import {
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  textPanel as textPanelStyle,
} from "./Styles.scss";
import { useLocation, useNavigate } from "@reach/router";

import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid2";
import ReportFull from "./ReportFull";
import classnames from "classnames";
import { compose } from "recompose";
import dispatchReport from "../hocs/dispatchReport";
import qs from "../functions/qs";
import { sortReportQuery } from "../selectors/report";
import withReportDefaults from "../hocs/withReportDefaults";

const indices = ["taxon", "assembly", "sample", "feature"];

const reportTypes = {
  arc: { name: "Arc", indices },
  histogram: { name: "Histogram", indices },
  map: { name: "Map", indices: ["taxon", "assembly", "sample"] },
  oxford: { name: "Oxford", indices: ["feature"] },
  ribbon: { name: "Ribbon", indices: ["feature"] },
  scatter: { name: "Scatter", indices },
  sources: { name: "Sources", indices: ["taxon"] },
  table: { name: "Table", indices },
  tree: { name: "Tree", indices: ["taxon", "assembly", "sample"] },
};

const ReportPanel = ({ options, reportDefaults, setReportTerm }) => {
  let css = classnames(infoPanelStyle, infoPanel1ColumnStyle, textPanelStyle);
  const reportRef = useRef(null);
  const location = useLocation();
  // useEffect(() => {
  //   if (location.search.match("report=")) {
  //     reportRef.current.scrollIntoView();
  //   }
  // }, []);

  const navigate = useNavigate();
  const setReport = (report) => {
    let newOptions = { ...options };
    if (report) {
      newOptions.report = report;
    } else {
      delete newOptions.report;
    }
    navigate(
      `${location.pathname}?${qs.stringify(newOptions)}${location.hash}`,
    );
  };
  let { query, report, ...treeOptions } = options;
  let queryString = qs.stringify({
    ...treeOptions,
    ...reportDefaults[report],
    report,
  });

  const handleDelete = () => {
    setReportTerm(false);
    setReport();
  };
  const handleClick = (key) => {
    setReport(key);
  };
  return (
    <div
      id="report-panel"
      className={css}
      ref={reportRef}
      style={{ maxHeight: "100%" }}
    >
      {/* <div className={headerStyle}>
        <span className={titleStyle}>{title}</span>
      </div> */}

      {/* {text && <div>{text}</div>} */}
      <Grid
        container
        spacing={1}
        direction="row"
        style={{ width: "100%" }}
        size={12}
      >
        {Object.entries(reportTypes)
          .filter(([key, obj]) => (obj.indices || []).includes(options.result))
          .map(([key, obj]) => {
            return (
              <Grid
                style={{ cursor: "pointer" }}
                onClick={() => setReport(key)}
                key={key}
              >
                <Chip
                  label={obj.name}
                  variant={key == report ? undefined : "outlined"}
                  onClick={() => handleClick(key)}
                  onDelete={key == report ? handleDelete : undefined}
                />
              </Grid>
            );
          })}
      </Grid>

      <Grid container spacing={1} direction="row" size={12}>
        {report && (
          <ReportFull
            reportId={sortReportQuery({ queryString })}
            report={report}
            queryString={queryString}
            topLevel={false}
            inModal={false}
          />
        )}
      </Grid>
    </div>
  );
};

export default compose(memo, withReportDefaults, dispatchReport)(ReportPanel);
