import {
  arrowLarge as arrowLargeStyle,
  arrowRight as arrowRightStyle,
  arrow as arrowStyle,
  attrInfo as attrInfoStyle,
  bold as boldStyle,
  content as contentStyle,
  fieldCount as fieldCountStyle,
  fieldHighlight as fieldHighlightStyle,
  fieldNameHighlight as fieldNameHighlightStyle,
  fieldName as fieldNameStyle,
  field as fieldStyle,
  fieldValue as fieldValueStyle,
  header as headerStyle,
  identifierPrefix as identifierPrefixStyle,
  identifier as identifierStyle,
  infoName as infoNameStyle,
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  infoValue as infoValueStyle,
  nameGroup as nameGroupStyle,
  resultPanel as resultPanelStyle,
  title as titleStyle,
} from "./Styles.scss";
import { useLocation, useNavigate } from "@reach/router";

import AggregationIcon from "./AggregationIcon";
import Grid from "@mui/material/Grid2";
import HistogramSVG from "./HistogramSVG";
import React from "react";
import TaxonSummaryPanel from "./TaxonSummaryPanel";
import Tooltip from "./Tooltip";
import WordCloud from "./WordCloud";
import classnames from "classnames";
import { compose } from "redux";
import { formatter } from "../functions/formatter";
import qs from "../functions/qs";
import withRecord from "../hocs/withRecord";
import withSearch from "../hocs/withSearch";
import withSiteName from "#hocs/withSiteName";
import withSummary from "../hocs/withSummary";
import withTaxonomy from "../hocs/withTaxonomy";
import withTypes from "../hocs/withTypes";

const AttributeSummary = ({
  field,
  searchIndex,
  basename,
  summaryField,
  handleFieldClick,
}) => {
  let length = 1;
  let { value } = field;

  if (Array.isArray(value)) {
    if (value.length == 0) {
      return null;
    }
    value = formatter(value, searchIndex, "array");
    let charLimit = 20;
    let entries = [];
    for (let v of value.values) {
      let entry = v[0];
      if (charLimit == 20 || charLimit - entry.length > 0) {
        entries.push(entry);
        charLimit -= entry.length;
      }
    }
    value = entries.join(",");
    if (field.value.length > 1) {
      length = field.value.length;
      if (field.value.length > entries.length) {
        value += ", ...";
      }
    }
  } else {
    value = formatter(value);
  }
  let highlight = [null, null];
  if (location.pathname == basename + "/explore" && field.id == summaryField) {
    highlight = [fieldHighlightStyle, fieldNameHighlightStyle];
  }
  let details;
  if (field.aggregation_method.endsWith("list") && length > 1) {
    details = `${field.aggregation_method} (${length}), n=${field.count}`;
  } else {
    details = `${field.aggregation_method}, n=${field.count}`;
  }
  let summary = (
    <Tooltip key={field.id} title={"Click to view summary plot"} arrow>
      <Grid>
        <div
          key={field.id}
          className={classnames(fieldStyle, highlight[0])}
          onClick={() => handleFieldClick(field.id)}
          // style={{ minWidth: "150px" }}
        >
          <div className={classnames(fieldNameStyle, highlight[1])}>
            {field.id}
          </div>
          <div className={fieldValueStyle}>
            <Grid
              container
              direction="row"
              wrap="nowrap"
              spacing={1}
              alignItems={"center"}
            >
              <Grid>
                <AggregationIcon
                  method={field.aggregation_source}
                  hasDescendants={field.has_descendants}
                />
              </Grid>

              <Grid>{value}</Grid>
            </Grid>
          </div>
          <div className={fieldCountStyle}>{details}</div>
        </div>
      </Grid>
    </Tooltip>
  );
  summary = (
    <div key={field.id} className={attrInfoStyle}>
      <div className={infoNameStyle}>{field.id}</div>
      <AggregationIcon
        method={field.aggregation_source}
        hasDescendants={field.has_descendants}
      />
      <div className={infoValueStyle}>{value}</div>
    </div>
  );
  return summary;
};

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
  basename,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  let options = qs.parse(location.search.replace(/^\?/, ""));
  const handleTaxonClick = () => {
    setPreferSearchTerm(false);
    navigate(
      `${basename}/record?recordId=${taxon_id}&result=taxon&taxonomy=${
        options.taxonomy || taxonomy
      }#${encodeURIComponent(scientific_name)}`,
    );
    // setRecordId(taxon_id);
  };
  const handleFieldClick = (fieldId) => {
    // fetchLineage(taxon_id);
    // setRecordId(taxon_id);
    setSummaryField(fieldId);
    setPreferSearchTerm(false);
    navigate(
      `${basename}/explore?taxon_id=${taxon_id}&result=${searchIndex}&taxonomy=${
        options.taxonomy || taxonomy
      }&field_id=${fieldId}${location.hash}`,
    );
  };
  let css = classnames(infoPanelStyle, infoPanel1ColumnStyle, resultPanelStyle);
  let groupedDivs = {};
  let fieldDivs = [];
  let taxonSummary;

  if (fields) {
    fields.forEach((field) => {
      if (typeof field.value === "undefined" || !field.aggregation_method) {
        return;
      }
      let newDiv = AttributeSummary({
        field,
        searchIndex,
        basename,
        summaryField,
        handleFieldClick,
      });
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
    taxonSummary = (
      <Grid size={12}>
        <TaxonSummaryPanel
          taxonId={taxon_id}
          scientific_name={scientific_name}
        />
      </Grid>
    );
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
        <div className={headerStyle} onClick={handleTaxonClick}>
          <span className={titleStyle}>{taxon_rank}</span>
          <span className={identifierStyle}>
            <span className={identifierPrefixStyle}>taxId:</span>
            {taxon_id}
          </span>
        </div>
      </Tooltip>
      {location.pathname != basename + "/record" && (
        <div style={{ right: "0", top: "2em" }} onClick={handleTaxonClick}>
          <Tooltip title={"Click to view record"} arrow>
            <i
              className={classnames(
                arrowStyle,
                arrowRightStyle,
                arrowLargeStyle,
              )}
            ></i>
          </Tooltip>
        </div>
      )}

      <div>
        {/* <Grid
          container
          alignItems="center"
          direction="row"
          spacing={0}
          style={{ width: "100%" }}
          size={12}
        >
          <div className={nameGroupStyle}>
            <div className={contentStyle}>
              <span className={classnames(boldStyle)}>{scientific_name}</span>
            </div>
          </div>
        </Grid> */}
        <Grid container alignItems="center" direction="row" spacing={0}>
          {taxonSummary}
        </Grid>
        <Grid container alignItems="center" direction="row" spacing={0}>
          {fieldDivs}
        </Grid>

        {/* <div className={flexRowStyle}>{fieldDivs}</div>
        {additionalDivs.length > 0 && (
          <div className={flexRowStyle}>{additionalDivs}</div>
        )} */}
        <div>{summaryPlot}</div>
      </div>
    </div>
  );
};

export default compose(
  withSiteName,
  withTaxonomy,
  withRecord,
  withSearch,
  withSummary,
  withTypes,
)(ResultPanel);
