import React, { useState } from "react";

import CloseIcon from "@material-ui/icons/Close";
import FindInPageIcon from "@material-ui/icons/FindInPage";
import Grid from "@material-ui/core/Grid";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import { compose } from "recompose";
import qs from "qs";
import { setSearchTerm } from "../reducers/search";
import { useNavigate } from "@reach/router";
import withReportById from "../hocs/withReportById";
import withReportTerm from "../hocs/withReportTerm";
import withSearch from "../hocs/withSearch";
import withTaxonomy from "../hocs/withTaxonomy";

export const ReportQuery = ({
  reportById,
  report,
  setPreferSearchTerm,
  reportTerm,
  setReportTerm,
  taxonomy,
}) => {
  const navigate = useNavigate();
  const [value, setValue] = useState(reportTerm || "");
  let terms = [];
  if (!reportById.report || !reportById.report[report]) {
    return null;
  }

  const handleSearch = (searchTerm) => {
    let options = {
      ...searchTerm,
      report,
      summaryValues: "count",
      offset: 0,
      taxonomy,
    };
    if (options.ranks && Array.isArray(options.ranks)) {
      options.ranks = options.ranks.join(",");
    }
    navigate(
      `/search?${qs.stringify(options)}#${encodeURIComponent(options.query)}`
    );
  };

  let params = ["x", "y"];
  let reports = reportById.report[report];
  if (!Array.isArray(reports)) reports = [reports];
  reports.forEach((rep) => {
    params.forEach((param) => {
      if (rep[param] > 0 && rep[`${param}Query`]) {
        terms.push(
          <Grid item style={{ width: "100%" }} key={param}>
            <Grid container direction="row" style={{ width: "100%" }}>
              <Grid item xs={11}>
                {rep[`${param}Query`].query}
              </Grid>
              <Grid item xs={1}>
                <SearchIcon
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    handleSearch(rep[`${param}Query`]);
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
        );
      }
    });
  });
  let searchInReport;
  const handleKeyPress = (e) => {
    if (e.key == "Enter" || e.keyCode == 13) {
      handleUpdate(e.target.value);
    }
  };
  const handleChange = (e) => {
    setValue(e.target.value);
  };
  const handleUpdate = (value) => {
    setValue(value);
    setReportTerm(value ? value.toLowerCase() : false);
  };
  if (report == "tree" || report == "scatter") {
    searchInReport = (
      <Grid item style={{ width: "100%" }}>
        <Grid container direction="row" alignItems="flex-end">
          <Grid item xs={10}>
            <TextField
              value={value}
              fullWidth
              label="Find in report"
              onChange={handleChange}
              onKeyPress={handleKeyPress}
            />
          </Grid>
          <Grid item xs={1}>
            <FindInPageIcon
              style={{ cursor: "pointer" }}
              onClick={() => {
                handleUpdate(value);
              }}
            />
          </Grid>
          <Grid item xs={1}>
            <CloseIcon
              style={{ cursor: "pointer" }}
              onClick={() => {
                handleUpdate();
              }}
            />
          </Grid>
        </Grid>
      </Grid>
    );
  }
  return (
    <Grid
      container
      direction="column"
      style={{ height: "100%", width: "100%" }}
      spacing={2}
    >
      {searchInReport}
      <Grid item style={{ width: "100%" }}>
        Search using report query:
      </Grid>
      {terms}
    </Grid>
  );
};

export default compose(
  withTaxonomy,
  withSearch,
  withReportById,
  withReportTerm
)(ReportQuery);
