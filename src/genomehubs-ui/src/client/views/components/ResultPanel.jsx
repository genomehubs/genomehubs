import { useLocation, useNavigate } from "@reach/router";

import AggregationIcon from "./AggregationIcon";
import Grid from "@material-ui/core/Grid";
import HistogramSVG from "./HistogramSVG";
import React from "react";
import Tooltip from "@material-ui/core/Tooltip";
import WordCloud from "./WordCloud";
import classnames from "classnames";
import { compose } from "recompose";
import { formatter } from "../functions/formatter";
import qs from "qs";
import styles from "./Styles.scss";
import withRecord from "../hocs/withRecord";
import withSearch from "../hocs/withSearch";
import withSummary from "../hocs/withSummary";
import withTaxonomy from "../hocs/withTaxonomy";
import withTypes from "../hocs/withTypes";

const ResultPanel = ({
  scientific_name,
  taxon_id,
  taxon_rank,
  fields,
  summaryField,
  setSummaryField,
  setPreferSearchTerm,
  searchIndex,
  sequence,
  summaryId,
  summary,
  types,
  taxonomy,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  let options = qs.parse(location.search.replace(/^\?/, ""));
  const handleTaxonClick = () => {
    setPreferSearchTerm(false);
    navigate(
      `/record?recordId=${taxon_id}&result=taxon&taxonomy=${
        options.taxonomy || taxonomy
      }#${encodeURIComponent(scientific_name)}`
    );
    // setRecordId(taxon_id);
  };
  const handleFieldClick = (fieldId) => {
    // fetchLineage(taxon_id);
    // setRecordId(taxon_id);
    setSummaryField(fieldId);
    setPreferSearchTerm(false);
    navigate(
      `/explore?taxon_id=${taxon_id}&result=${searchIndex}&taxonomy=${
        options.taxonomy || taxonomy
      }&field_id=${fieldId}${location.hash}`
    );
  };
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.resultPanel
  );
  let groupedDivs = {};
  let fieldDivs = [];

  if (fields) {
    fields.forEach((field) => {
      let value = field.value;
      if (Array.isArray(value)) {
        value = value[0];
      }
      value = isNaN(value) ? value : formatter(value);
      if (Array.isArray(field.value) && field.count > 1) {
        value = `${value} ...`;
      }
      let highlight = null;
      if (location.pathname == "/explore" && field.id == summaryField) {
        highlight = styles["fieldNameHighlight"];
      }
      let newDiv = (
        <Tooltip key={field.id} title={"Click to view summary plot"} arrow>
          <Grid item>
            <div
              key={field.id}
              className={styles.field}
              onClick={() => handleFieldClick(field.id)}
              // style={{ minWidth: "150px" }}
            >
              <div className={classnames(styles.fieldName, highlight)}>
                {field.id}
              </div>
              <div className={styles.fieldValue}>
                <Grid
                  container
                  direction="row"
                  wrap="nowrap"
                  spacing={1}
                  alignItems={"center"}
                >
                  <Grid item>
                    <AggregationIcon
                      method={field.aggregation_source}
                      hasDescendants={field.has_descendants}
                    />
                  </Grid>

                  <Grid item>{value}</Grid>
                </Grid>
              </div>
              <div
                className={styles.fieldCount}
              >{`${field.aggregation_method}, n=${field.count}`}</div>
            </div>
          </Grid>
        </Tooltip>
      );
      if (types[field.id] && types[field.id].traverse) {
        let group = types[field.id].display_group;
        if (!groupedDivs.hasOwnProperty(group)) {
          groupedDivs[group] = [];
        }
        if (types[field.id] && types[field.id].display_level == 1) {
          // fieldDivs.push(newDiv);
          groupedDivs[group].unshift(newDiv);
        } else {
          // additionalDivs.push(newDiv);
          groupedDivs[group].push(newDiv);
        }
      }
    });
  }
  Object.keys(groupedDivs).forEach((key) => {
    fieldDivs = fieldDivs.concat(groupedDivs[key]);
  });
  let summaryPlot;
  if (summaryId) {
    if (summary == "histogram") {
      summaryPlot = (
        <div style={{ width: "80%" }}>
          <HistogramSVG
            summaryId={summaryId}
            scientific_name={scientific_name}
            sequence={sequence}
          />
        </div>
      );
    } else if (summary == "terms") {
      summaryPlot = (
        <div style={{ width: "80%" }}>
          <WordCloud
            summaryId={summaryId}
            scientific_name={scientific_name}
            sequence={sequence}
          />
        </div>
      );
    }
  }

  return (
    <div className={css}>
      <Tooltip title={"Click to view record"} arrow placement="top">
        <div className={styles.header} onClick={handleTaxonClick}>
          <span className={styles.title}>{scientific_name}</span>
          <span> ({taxon_rank})</span>
          <span className={styles.identifier}>
            <span className={styles.identifierPrefix}>taxId:</span>
            {taxon_id}
          </span>
        </div>
      </Tooltip>
      {location.pathname != "/record" && (
        <div style={{ right: "0", top: "2em" }} onClick={handleTaxonClick}>
          <Tooltip title={"Click to view record"} arrow>
            <i
              className={classnames(
                styles.arrow,
                styles.arrowRight,
                styles.arrowLarge
              )}
            ></i>
          </Tooltip>
        </div>
      )}

      <div>
        <Grid container alignItems="center" direction="row" spacing={0}>
          {fieldDivs}
        </Grid>
        {/* <div className={styles.flexRow}>{fieldDivs}</div>
        {additionalDivs.length > 0 && (
          <div className={styles.flexRow}>{additionalDivs}</div>
        )} */}
        <div>{summaryPlot}</div>
      </div>
    </div>
  );
};

export default compose(
  withTaxonomy,
  withRecord,
  withSearch,
  withSummary,
  withTypes
)(ResultPanel);
