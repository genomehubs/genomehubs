import React, { Fragment, useRef, useState } from "react";
import { useLocation, useNavigate } from "@reach/router";

import CloseIcon from "@material-ui/icons/Close";
import CodeIcon from "@material-ui/icons/Code";
import EditIcon from "@material-ui/icons/Edit";
import GetAppIcon from "@material-ui/icons/GetApp";
import Grid from "@material-ui/core/Grid";
import LinkIcon from "@material-ui/icons/Link";
import ReportCode from "./ReportCode";
import ReportDownload from "./ReportDownload";
import ReportEdit from "./ReportEdit";
import ReportInfo from "./ReportInfo";
import ReportQuery from "./ReportQuery";
import SearchIcon from "@material-ui/icons/Search";
import TocIcon from "@material-ui/icons/Toc";
import { compose } from "recompose";
import { useStyles } from "./ReportModal";
import withReportTerm from "../hocs/withReportTerm";

export const ReportTools = ({
  reportEdit,
  setReportEdit,
  fetchReport,
  handleClose,
  queryString,
  reportId,
  report,
  topLevel,
  chartRef,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const classes = useStyles();
  const [code, setCode] = useState(false);
  const [query, setQuery] = useState(false);
  const [download, setDownload] = useState(false);
  const [info, setInfo] = useState(false);

  const permaLink = (queryString, toggle) => {
    let path = topLevel ? "report" : toggle ? "reporturl" : "report";
    // TODO: include taxonomy
    navigate(`/${path}?${queryString.replace(/^\?/, "")}`);
  };

  const handleUpdate = ({ queryString, hash }) => {
    if (hash && !hash.startsWith("#")) {
      hash = "#" + hash;
    } else {
      hash = hash || "";
    }
    navigate(`${location.pathname}?${queryString.replace(/^\?/, "")}${hash}`);
  };

  let reportComponent;

  const ReportOverlay = ({ children }) => (
    <div
      style={{
        maxHeight: "calc( 100% - 2em )",
        width: code ? "800px" : "400px",
        right: "5em",
        padding: "1em",
        top: "2em",
        position: "absolute",
        backgroundColor: "rgba(255,255,255,0.9)",
        overflowY: "auto",
        overFlowX: "visible",
        backdropFilter: "blur(0.25em)",
      }}
    >
      {children}
    </div>
  );

  let overlay;
  if (reportEdit && !query && !info && !download && !code) {
    overlay = (
      <ReportEdit
        reportId={reportId}
        report={report}
        fetchReport={fetchReport}
        // modal={modal}
        permaLink={permaLink}
        handleUpdate={handleUpdate}
      />
    );
  } else if (query) {
    overlay = <ReportQuery reportId={reportId} report={report} />;
  } else if (info) {
    overlay = <ReportInfo reportId={reportId} report={report} />;
  } else if (download) {
    overlay = (
      <ReportDownload
        reportId={reportId}
        report={report}
        chartRef={chartRef}
        code={code}
        queryString={queryString}
      />
    );
  } else if (code) {
    overlay = (
      <ReportCode
        reportId={reportId}
        report={report}
        queryString={queryString}
      />
    );
  }

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        position: "relative",
        zIndex: 10000,
      }}
    >
      <div
        style={{
          height: "100%",
          width: "100%",
          top: "2em",
          position: "absolute",
        }}
      >
        <Grid container direction="column">
          {/* <Grid item align="right">
            {handleClose && (
              <CloseIcon onClick={handleClose} style={{ cursor: "pointer" }} />
            )}
          </Grid> */}
          {!topLevel && (
            <Grid item align="right">
              <EditIcon
                onClick={() => {
                  setInfo(false);
                  setQuery(false);
                  setDownload(false);
                  setReportEdit(!reportEdit);
                }}
                style={{ cursor: "pointer" }}
              />
            </Grid>
          )}
          {!topLevel && (
            <Grid item align="right">
              <SearchIcon
                onClick={() => {
                  setInfo(false);
                  setReportEdit(false);
                  setDownload(false);
                  setQuery(!query);
                }}
                style={{ cursor: "pointer" }}
              />
            </Grid>
          )}
          <Grid item align="right">
            <TocIcon
              onClick={() => {
                setInfo(!info);
                setReportEdit(false);
                setDownload(false);
                setQuery(false);
              }}
              style={{ transform: "scaleX(-1)", cursor: "pointer" }}
            />
          </Grid>

          <Grid item align="right">
            <LinkIcon
              onClick={() => {
                permaLink(queryString, true);
              }}
              style={{ cursor: "pointer" }}
            />
          </Grid>
          <Grid item align="right">
            <CodeIcon
              onClick={(e) => {
                setCode(!code);
              }}
              style={{ cursor: "pointer" }}
            />
          </Grid>
          {/* <Grid item align="right">
            <GetAppIcon
              onClick={(e) => {
                if (code) {
                  exportChart(e, "json");
                } else {
                  exportChart();
                }
              }}
              style={{ cursor: "pointer" }}
            />
          </Grid> */}
          <Grid item align="right">
            <GetAppIcon
              onClick={() => {
                setInfo(false);
                setReportEdit(false);
                setDownload(!download);
                setQuery(false);
              }}
              style={{ cursor: "pointer" }}
            />
          </Grid>
        </Grid>
      </div>
      {overlay && (
        <div
          style={{
            height: "100%",
            width: "100vw",
            right: "4em",
            top: "2em",
            position: "absolute",
          }}
          onClick={() => {
            setInfo(false);
            setReportEdit(false);
            setDownload(false);
            setQuery(false);
          }}
        />
      )}
      {overlay && <ReportOverlay>{overlay}</ReportOverlay>}
    </div>
  );
};

export default compose(withReportTerm)(ReportTools);

// if (code) {
//   reportComponent = (
//     <div style={{ height: "100%", width: "100%", overflow: "auto" }}>
//       <ReportCode
//         reportId={reportId}
//         report={report}
//         queryString={queryString}
//       />
//     </div>
//   );
// }
