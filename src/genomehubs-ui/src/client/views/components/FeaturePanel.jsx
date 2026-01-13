import React, { useEffect, useState } from "react";
import {
  header as headerStyle,
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  resultPanel as resultPanelStyle,
  title as titleStyle,
} from "./Styles.scss";

import BasicSelect from "./BasicSelect";
import FeatureSummaryPanel from "./FeatureSummaryPanel";
import Grid from "@mui/material/Grid";
import { Template } from "./Markdown";
import classnames from "classnames";
import { compose } from "redux";
import withRecord from "#hocs/withRecord";

const FeaturePanel = ({
  record,
  records,
  fetchRecord,
  recordIsFetching,
  result,
  taxonomy,
}) => {
  let css = classnames(infoPanelStyle, infoPanel1ColumnStyle, resultPanelStyle);

  const [selectedTemplate, setSelectedTemplate] = useState("none");

  const templateValues = {
    " ": "none",
    containing: "contains",
    "contained by": "contained",
    overlapping: "overlap",
  };

  let sequenceId;
  let assemblyId;
  let taxonId;
  let featureId;
  if (record && record.record) {
    featureId = record.record.feature_id;
    taxonId = record.record.taxon_id;
    assemblyId = record.record.assembly_id;
    let sequenceObj = record.record.attributes.sequence_id;
    if (sequenceObj) {
      sequenceId = sequenceObj.value;
    }
  }

  const handleUpdateTemplate = (e) => {
    setSelectedTemplate(e.target.value);
  };

  useEffect(() => {
    if (sequenceId && !records[sequenceId] && !recordIsFetching) {
      fetchRecord({ recordId: sequenceId, result, taxonomy });
    }
    if (taxonId && !records[taxonId] && !recordIsFetching) {
      fetchRecord({ recordId: taxonId, result: "taxon", taxonomy });
    }
    if (assemblyId && !records[assemblyId] && !recordIsFetching) {
      fetchRecord({ recordId: assemblyId, result: "assembly", taxonomy });
    }
  }, [records]);

  let primaryColor = "#ff7001";
  let secondaryColor = "#666666";
  let width = 1000;
  let margin = 0.05;
  let height = 100;
  let boldStroke = 3;
  let fineStroke = 2;
  let fontFamily = "'Roboto Mono', 'Courier New', Courier, monospace";

  let content;
  let ensemblUrl;
  let assignedName;
  let featureAttributes;
  let region;

  let scale = (value) => value * width * (1 - 2 * margin);

  if (record && record.record && sequenceId && records[sequenceId]) {
    featureAttributes = record.record.attributes;
    let sequenceAttributes = records[sequenceId].record.attributes;
    let sequenceIdentifiers = records[sequenceId].record.identifiers;
    assignedName = sequenceIdentifiers.filter(
      (obj) => obj.class == "assigned_name",
    );
    if (assignedName.length == 1) {
      assignedName = assignedName[0].identifier;
    } else {
      assignedName = sequenceIdentifiers.filter(
        (obj) => obj.class == "genbank_accession",
      );
      if (assignedName.length == 1) {
        assignedName = assignedName[0].identifier;
      } else {
        assignedName = undefined;
      }
    }

    let midX =
      scale(
        featureAttributes.midpoint.value / sequenceAttributes.length.value,
      ) +
      width * margin;
    let len = scale(
      featureAttributes.length.value / sequenceAttributes.length.value,
    );
    let startX = midX - len / 2;
    let endX = midX + len / 2;
    let featureLabel = `${featureAttributes.start.value.toLocaleString()}-${featureAttributes.end.value.toLocaleString()}`;
    let labelWidth = featureLabel.length * height * 0.1;
    if (labelWidth / 2 > midX) {
      midX = labelWidth / 2;
    } else if (midX + labelWidth / 2 > width) {
      midX = width - labelWidth / 2;
    }
    let strand = featureAttributes.strand.value;
    let featureGroup = (
      <g id={"feature-group"}>
        <line
          id={"start-line"}
          x1={startX}
          y1={height * 0.45}
          x2={startX}
          y2={height * 0.5}
          fill={"none"}
          stroke={primaryColor}
          strokeWidth={boldStroke}
          strokeLinecap={"round"}
        />
        <text
          id={"feature-label"}
          fill={primaryColor}
          x={midX}
          y={height * 0.4}
          fontSize={height * 0.15}
          fontFamily={fontFamily}
          textAnchor={"middle"}
          dominantBaseline={"bottom"}
        >
          {featureLabel}
        </text>
        <line
          id={"end-line"}
          x1={endX}
          y1={height * 0.45}
          x2={endX}
          y2={height * 0.5}
          fill={"none"}
          stroke={primaryColor}
          strokeWidth={boldStroke}
          strokeLinecap={"round"}
        />
        <line
          id={"strand-arrow"}
          x1={strand >= 0 ? startX : endX}
          y1={height * 0.15}
          x2={strand >= 0 ? endX : startX}
          y2={height * 0.15}
          fill={primaryColor}
          stroke={primaryColor}
          strokeWidth={boldStroke}
          strokeLinecap={"round"}
          markerEnd={"url(#arrowhead)"}
        />
      </g>
    );
    content = (
      <g>
        <g id={"sequence-group"}>
          <line
            id={"sequence-line"}
            x1={width * margin}
            y1={height * 0.5}
            x2={width * (1 - margin)}
            y2={height * 0.5}
            fill={"none"}
            stroke={primaryColor}
            strokeWidth={boldStroke}
            strokeLinecap={"round"}
          />
          <line
            id={"seq-start-line"}
            x1={margin * width}
            y1={height * 0.5}
            x2={margin * width}
            y2={height * 0.55}
            fill={"none"}
            stroke={primaryColor}
            strokeWidth={boldStroke}
            strokeLinecap={"round"}
          />
          <line
            id={"seq-end-line"}
            x1={width * (1 - margin)}
            y1={height * 0.5}
            x2={width * (1 - margin)}
            y2={height * 0.55}
            fill={"none"}
            stroke={primaryColor}
            strokeWidth={boldStroke}
            strokeLinecap={"round"}
          />
          <text
            id={"sequence-label"}
            fill={primaryColor}
            x={width / 2}
            y={height * 0.6}
            fontSize={height * 0.2}
            fontFamily={fontFamily}
            textAnchor={"middle"}
            dominantBaseline={"hanging"}
          >
            {featureAttributes.sequence_id.value}
          </text>
          <text
            id={"one-label"}
            fill={secondaryColor}
            x={width * (margin - 0.005)}
            y={height * 0.65}
            fontSize={height * 0.15}
            fontFamily={fontFamily}
            textAnchor={"start"}
            dominantBaseline={"hanging"}
          >
            {`1 bp`}
          </text>
          <text
            id={"length-label"}
            fill={secondaryColor}
            x={width * (1.005 - margin)}
            y={height * 0.65}
            fontSize={height * 0.15}
            fontFamily={fontFamily}
            textAnchor={"end"}
            dominantBaseline={"hanging"}
          >
            {`${sequenceAttributes.length.value.toLocaleString()} bp`}
          </text>
        </g>
        {featureGroup}
      </g>
    );
    // if (assignedName && assemblyId && records[assemblyId]) {
    //   // console.log({ assignedName });
    //   // let identifiers = (records[assemblyId].record.identifiers || []).filter(
    //   //   (obj) => obj.class.match(/ensembl.*id/)
    //   // );
    //   // if (identifiers.length > 0) {
    //   //   ensemblUrl = `https://rapid.ensembl.org/${identifiers[0].identifier}/Location/View?r=${assignedName}%3A${featureAttributes.start.value}-${featureAttributes.end.value}`;
    //   // }
    // }
  }

  let browserLinks;
  if (assignedName && featureAttributes && records[assemblyId]) {
    browserLinks = (
      // <>
      //   View region in{" "}
      //   <span style={{ textDecoration: "underline" }}>
      //     <NavLink href={ensemblUrl}>Ensembl Rapid Release</NavLink>
      //   </span>
      // </>
      <FeatureSummaryPanel
        taxonId={taxonId}
        assemblyId={assemblyId}
        start={featureAttributes.start.value}
        end={featureAttributes.end.value}
        sequenceName={assignedName}
      />
    );
  }
  let assemblyLink;

  let templates;
  if (content) {
    // Add searches to show:
    //   - similar features on the same sequence
    //   - features containing, overlapping or contained by this feature
    //     (with option to restrict by type)
    //   - assembly or taxon record for this feature

    region = `${featureAttributes.start.value}-${featureAttributes.end.value}`;

    if (selectedTemplate != "none") {
      let templateId;
      switch (selectedTemplate) {
        case "contains": {
          templateId = "featureContainsRegion";
          break;
        }
        case "contained": {
          templateId = "featureContainedByRegion";
          break;
        }
        default: {
          templateId = "featureOverlappingRegion";
          break;
        }
      }
      templates = (
        <Grid xs={6}>
          <Template
            id={templateId}
            valueA={"*"}
            valueB={sequenceId}
            valueC={featureAttributes.start.value}
            valueD={featureAttributes.end.value}
          />
        </Grid>
      );
    }
  }

  let svg = (
    <svg
      viewBox={`0 0 ${width} ${height * 0.9}`}
      preserveAspectRatio="xMinYMin"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth={height * 0.07}
          markerHeight={height * 0.05}
          refX={height * 0.03}
          refY={height * 0.025}
          fill={primaryColor}
          orient="auto"
        >
          <polygon
            points={`0 0, ${height * 0.07} ${height * 0.025}, 0 ${
              height * 0.05
            }`}
          />
        </marker>
      </defs>
      {content}
    </svg>
  );

  return (
    <div className={css}>
      <div className={headerStyle}>
        <span className={titleStyle}>Feature — {featureId}</span>
      </div>
      <div>{svg}</div>
      <Grid container direction="column">
        <Grid container direction="row" spacing={1}>
          <Grid size={1}></Grid>
          <Grid size={2}>
            <BasicSelect
              id={"select-feature-template"}
              handleChange={handleUpdateTemplate}
              helperText={"show search template"}
              current={selectedTemplate}
              values={templateValues}
            />
          </Grid>
          <Grid style={{ flexGrow: "1" }}></Grid>
          <Grid>{browserLinks}</Grid>
        </Grid>
        <Grid container direction="row" spacing={1}>
          <Grid size={3}></Grid>
          {templates}
        </Grid>
      </Grid>
      <p />
    </div>
  );
};

export default compose(withRecord)(FeaturePanel);
