import React, { useEffect } from "react";

import AnalysisTableRow from "./AnalysisTableRow";
import NavLink from "./NavLink";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import classnames from "classnames";
import { compose } from "recompose";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import withAnalysesByAnyId from "../hocs/withAnalysesByAnyId";
import withAnalysis from "../hocs/withAnalysis";
import withRecord from "../hocs/withRecord";

const FeaturePanel = ({
  recordId,
  record,
  records,
  fetchRecord,
  recordIsFetching,
  ensemblAssemblyId = "Erynnis_tages_GCA_905147235.1",
  result,
  taxonomy,
}) => {
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.resultPanel
  );
  let sequenceId;
  if (record && record.record) {
    let sequenceObj = record.record.attributes.sequence_id;
    if (sequenceObj) {
      sequenceId = sequenceObj.value;
    }
  }

  console.log(records);

  useEffect(() => {
    if (sequenceId && !records[sequenceId] && !recordIsFetching) {
      fetchRecord(sequenceId, result, taxonomy);
    }
  }, [records]);

  let primaryColor = "black";
  let secondaryColor = "#666666";
  let width = 1000;
  let margin = 0.05;
  let height = 100;
  let boldStroke = 3;
  let fineStroke = 2;
  let fontFamily = "'Roboto Mono', 'Courier New', Courier, monospace";

  let content;
  let ensemblUrl;

  let scale = (value) => value * width * (1 - 2 * margin);

  if (record && record.record && sequenceId && records[sequenceId]) {
    let featureAttributes = record.record.attributes;
    let sequenceAttributes = records[sequenceId].record.attributes;

    let midX =
      scale(
        featureAttributes.midpoint.value / sequenceAttributes.length.value
      ) +
      width * margin;
    let len = scale(
      featureAttributes.length.value / sequenceAttributes.length.value
    );
    let startX = midX - len / 2;
    let endX = midX + len / 2;
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
          {`${featureAttributes.start.value.toLocaleString()}-${featureAttributes.end.value.toLocaleString()}`}
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
          fill={"none"}
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
            y={height * 0.6}
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
            y={height * 0.6}
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
    ensemblUrl = `https://rapid.ensembl.org/${ensemblAssemblyId}/Location/View?r=4%3A${featureAttributes.start.value}-${featureAttributes.end.value}`;
  }

  let ensemblLink;
  if (ensemblUrl) {
    ensemblLink = (
      <>
        View region in{" "}
        <span style={{ textDecoration: "underline" }}>
          <NavLink href={ensemblUrl}>Ensembl Rapid Release</NavLink>
        </span>
      </>
    );
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
      <div className={styles.header}>
        <span className={styles.title}>Feature</span>
      </div>
      <div>{svg}</div>
      <div style={{ float: "right" }}>{ensemblLink}</div>
      <p />
    </div>
  );
};

export default compose(withRecord)(FeaturePanel);
