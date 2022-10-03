import React, { memo, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "@reach/router";

import Chip from "@material-ui/core/Chip";
import Grid from "@material-ui/core/Grid";
import ReportFull from "./ReportFull";
import ReportTerm from "./ReportTerm";
import classnames from "classnames";
import { compose } from "recompose";
import dispatchReport from "../hocs/dispatchReport";
import { formatter } from "../functions/formatter";
import qs from "../functions/qs";
import { sortReportQuery } from "../selectors/report";
import styles from "./Styles.scss";
import withReportDefaults from "../hocs/withReportDefaults";

const reportTypes = {
  arc: { name: "Arc" },
  histogram: { name: "Histogram" },
  map: { name: "Map" },
  oxford: { name: "Oxford" },
  scatter: { name: "Scatter" },
  table: { name: "Table" },
  tree: { name: "Tree" },
};

const ReportPanel = ({ options, reportDefaults, setReportTerm }) => {
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.textPanel
  );
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
      `${location.pathname}?${qs.stringify(newOptions)}${location.hash}`
    );
  };
  let { query, ...treeOptions } = options;
  let report = options.report;
  let queryString = qs.stringify({
    ...treeOptions,
    ...reportDefaults[report],
    report,
  });
  // TODO: use mui-grid

  const handleDelete = () => {
    setReportTerm(false);
    setReport();
  };
  const handleClick = (key) => {
    setReport(key);
  };
  return (
    <div className={css} ref={reportRef} style={{ maxHeight: "100%" }}>
      {/* <div className={styles.header}>
        <span className={styles.title}>{title}</span>
      </div> */}

      {/* {text && <div>{text}</div>} */}
      <Grid container spacing={1} direction="row" style={{ width: "100%" }}>
        {Object.keys(reportTypes).map((key) => {
          let obj = reportTypes[key];
          return (
            <Grid
              item
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

      <Grid container spacing={1} direction="row">
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
