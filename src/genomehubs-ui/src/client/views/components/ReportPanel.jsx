import {
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  textPanel as textPanelStyle,
} from "./Styles.scss";
import { memo, useRef } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import ReportFull from "./ReportFull";
import classnames from "classnames";
import { compose } from "redux";
import dispatchReport from "#hocs/dispatchReport";
import qs from "#functions/qs";
import { sortReportQuery } from "#selectors/report";
import { useLocation } from "@reach/router";
import useNavigate from "#hooks/useNavigate";
import withReportDefaults from "#hocs/withReportDefaults";

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
      if (
        report === "map" &&
        !newOptions.locationField &&
        !newOptions.regionField
      ) {
        newOptions.locationField = "sample_location";
      }
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

  // Detect if this is a batch (msearch) query
  const isMsearch =
    options.query &&
    typeof options.query === "string" &&
    /[;\n]/.test(options.query);

  // If msearch, extract individual queries and build links
  let msearchQueries = [];
  if (isMsearch) {
    const queries = options.query
      .split(/[;\n]/)
      .map((q) => q.trim())
      .filter((q) => q.length > 0);
    msearchQueries = queries.map((q) => ({
      original: q,
      display: q.match(/[()<>=]/) ? q : `tax_name(${q})`,
    }));
  }

  return (
    <div
      id="report-panel"
      className={css}
      ref={reportRef}
      style={{ maxHeight: "100%" }}
    >
      {isMsearch && (
        <Alert severity="info" style={{ marginBottom: "16px" }}>
          <div>
            <strong>Reports are not available for batch searches.</strong>
          </div>
          <div style={{ marginTop: "8px", fontSize: "0.95em" }}>
            To generate reports, search for individual queries:
          </div>
          <Box
            style={{
              marginTop: "8px",
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            {msearchQueries.map((item, idx) => {
              const queryParams = { ...options };
              delete queryParams.query;
              const singleQueryUrl = `/search?query=${encodeURIComponent(
                item.original,
              )}&${qs.stringify(queryParams)}`;
              return (
                <Link
                  key={idx}
                  href={singleQueryUrl}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#f5f5f5",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    textDecoration: "none",
                    color: "#1976d2",
                  }}
                >
                  {item.original}
                </Link>
              );
            })}
          </Box>
        </Alert>
      )}

      {!isMsearch && (
        <Grid
          container
          spacing={1}
          direction="row"
          style={{ width: "100%" }}
          size={12}
        >
          {Object.entries(reportTypes)
            .filter(([key, obj]) =>
              (obj.indices || []).includes(options.result),
            )
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
      )}

      {!isMsearch && report && (
        <Grid container spacing={1} direction="row" size={12}>
          <ReportFull
            reportId={sortReportQuery({ queryString })}
            report={report}
            queryString={queryString}
            topLevel={false}
            inModal={false}
          />
        </Grid>
      )}
    </div>
  );
};

export default compose(memo, withReportDefaults, dispatchReport)(ReportPanel);
