import { Suspense, lazy, useState } from "react";

import CodeIcon from "@mui/icons-material/Code";
import EditIcon from "@mui/icons-material/Edit";
import GetAppIcon from "@mui/icons-material/GetApp";
import Grid from "@mui/material/Grid";
import LinkIcon from "@mui/icons-material/Link";
import ReportCode from "./ReportCode";
import ReportEdit from "./ReportEdit";
import ReportInfo from "./ReportInfo";
import ReportQuery from "./ReportQuery";
import ReportSelect from "./ReportSelect";
import SearchIcon from "@mui/icons-material/Search";
import SelectIcon from "@mui/icons-material/SelectAll";
import TocIcon from "@mui/icons-material/Toc";
import Tooltip from "./Tooltip";
import { compose } from "redux";
import { useLocation } from "@reach/router";
import useNavigate from "#hooks/useNavigate";
import { useStyles } from "./ReportModalStyles";
import withColors from "#hocs/withColors";
import withReportTerm from "#hocs/withReportTerm";
import withSiteName from "#hocs/withSiteName";
import withTheme from "#hocs/withTheme";

// Lazy load download component to defer export libraries
const ReportDownload = lazy(() => import("./ReportDownload"));

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
  basename,
  theme,
  colorScheme,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const classes = useStyles();
  const [code, setCode] = useState(false);
  const [query, setQuery] = useState(false);
  const [download, setDownload] = useState(false);
  const [info, setInfo] = useState(false);
  const [select, setSelect] = useState(false);

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
        backgroundColor: `${colorScheme[theme].lightColor}e6`,
        border: `0.2em solid ${colorScheme[theme].darkColor}e6`,
        overflowY: "auto",
        overFlowX: "visible",
        backdropFilter: "blur(0.25em)",
      }}
    >
      {children}
    </div>
  );

  let overlay;
  if (reportEdit && !query && !info && !download && !code && !select) {
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
  } else if (select) {
    overlay = <ReportSelect reportId={reportId} report={report} />;
  } else if (download) {
    overlay = (
      <Suspense
        fallback={
          <div style={{ padding: "2rem", textAlign: "center" }}>
            Loading export options...
          </div>
        }
      >
        <ReportDownload
          reportId={reportId}
          report={report}
          chartRef={chartRef}
          code={code}
          queryString={queryString}
        />
      </Suspense>
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
        zIndex: 1000,
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
          {/* <Grid align="right">
            {handleClose && (
              <CloseIcon onClick={handleClose} style={{ cursor: "pointer" }} />
            )}
          </Grid> */}
          {!topLevel && (
            <Grid align="right">
              <Tooltip title={"Edit"} arrow placement="left">
                <EditIcon
                  onClick={() => {
                    setInfo(false);
                    setQuery(false);
                    setDownload(false);
                    setSelect(false);
                    setCode(false);
                    setReportEdit(!reportEdit);
                  }}
                  style={{ cursor: "pointer" }}
                />
              </Tooltip>
            </Grid>
          )}
          {!topLevel && (
            <Grid align="right">
              <Tooltip title={"Search"} arrow placement="left">
                <SearchIcon
                  onClick={() => {
                    setInfo(false);
                    setReportEdit(false);
                    setDownload(false);
                    setSelect(false);
                    setCode(false);
                    setQuery(!query);
                  }}
                  style={{ cursor: "pointer" }}
                />
              </Tooltip>
            </Grid>
          )}
          {!topLevel && (
            <Grid align="right">
              <Tooltip title={"Select"} arrow placement="left">
                <SelectIcon
                  onClick={() => {
                    setInfo(false);
                    setReportEdit(false);
                    setDownload(false);
                    setQuery(false);
                    setCode(false);
                    setSelect(!select);
                  }}
                  style={{ cursor: "pointer" }}
                />
              </Tooltip>
            </Grid>
          )}
          <Grid align="right">
            <Tooltip title={"Legend"} arrow placement="left">
              <TocIcon
                onClick={() => {
                  setInfo(!info);
                  setReportEdit(false);
                  setDownload(false);
                  setQuery(false);
                  setCode(false);
                  setSelect(false);
                }}
                style={{ transform: "scaleX(-1)", cursor: "pointer" }}
              />
            </Tooltip>
          </Grid>

          <Grid align="right">
            <Tooltip title={"Link"} arrow placement="left">
              <LinkIcon
                onClick={() => {
                  permaLink(queryString, true);
                }}
                style={{ cursor: "pointer" }}
              />
            </Tooltip>
          </Grid>
          <Grid align="right">
            <Tooltip title={"Code"} arrow placement="left">
              <CodeIcon
                onClick={(e) => {
                  setInfo(false);
                  setReportEdit(false);
                  setDownload(false);
                  setQuery(false);
                  setSelect(false);
                  setCode(false);
                  setCode(!code);
                }}
                style={{ cursor: "pointer" }}
              />
            </Tooltip>
          </Grid>
          {/* <Grid align="right">
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
          <Grid
            align="right"
            id="report-download-item"
            data-testid="report-tools-download-icon"
          >
            <Tooltip title={"Download"} arrow placement="left">
              <span
                onClick={() => {
                  setInfo(false);
                  setReportEdit(false);
                  setDownload(true);
                  setQuery(false);
                  setCode(false);
                  setSelect(false);
                }}
                style={{ cursor: "pointer" }}
                data-testid="report-tools-download-span"
              >
                <GetAppIcon />
              </span>
            </Tooltip>
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
            setCode(false);
            setSelect(false);
          }}
        />
      )}
      {overlay && <ReportOverlay>{overlay}</ReportOverlay>}
    </div>
  );
};

export default compose(
  withSiteName,
  withTheme,
  withColors,
  withReportTerm,
)(ReportTools);
