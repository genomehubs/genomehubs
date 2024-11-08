import React, { useCallback, useRef, useState } from "react";

import Phylopics from "./PhyloPics";
import Tooltip from "./Tooltip";
import Typography from "@mui/material/Typography";
import { compose } from "recompose";
import { scaleLog } from "d3-scale";
import setColors from "../functions/setColors";
import { useLongPress } from "use-long-press";
import withColors from "../hocs/withColors";
import withTypes from "../hocs/withTypes";

const ReportTreeRings = ({
  arcs,
  labels,
  ticks,
  handleNavigation,
  handleSearch,
  width,
  height,
  pointSize,
  colors,
  colorPalette,
  palettes,
  levels,
  hideSourceColors,
  hideErrorBars,
  hideAncestralBars,
  cats,
  phylopics,
}) => {
  if (!arcs || arcs.length == 0) {
    return null;
  }
  ({ levels, colors } = setColors({
    colorPalette,
    palettes,
    levels,
    count: cats.length || 1,
    colors,
  }));

  let divHeight = height;
  height = Math.min(
    Number.isNaN(height) ? 100 : height,
    Number.isNaN(width) ? 100 : width,
  );
  width = height;
  const [dimensions, setDimensions] = useState({
    x: 0,
    y: 0,
    height: 1000,
    width: 1000,
  });

  const [highlight, setHighlight] = useState();

  const anchorRef = useRef(null);

  const highlightSegment = (segment) => {
    setHighlight(segment);
  };

  const strokeScale = scaleLog()
    .domain([100, 1000])
    .range([1, 0.1])
    .clamp(true);

  let strokeWidth = strokeScale((arcs || 1).length);

  let paths = [];
  if (arcs) {
    let rootRank;
    if (arcs.length >= 2) {
      rootRank = arcs[arcs.length - 2].taxon_rank;
    } else {
      rootRank = arcs[0].taxon_rank;
    }
    arcs.forEach((segment) => {
      const longPressCallback = useCallback((e) => {
        e.preventDefault();
        handleSearch({
          root: segment.taxon_id,
          name: segment.scientific_name,
          depth: segment.depth,
          rank: segment.taxon_rank,
          rootRank,
        });
      }, []);

      const longPress = useLongPress(longPressCallback, {
        onStart: (e) => e.preventDefault(),
        onCancel: (e) => {
          highlightSegment();
          handleNavigation({
            root: segment.taxon_id,
            name: segment.scientific_name,
            depth: segment.depth,
            rank: segment.taxon_rank,
            rootRank,
          });
        },
        captureEvent: true,
        threshold: 500,
      });
      let { color } = segment;
      if (segment.cats && segment.cats.length == 1) {
        color = colors[segment.cats[0]];
      }
      paths.push(
        <Tooltip
          key={`tt-${segment.taxon_id}`}
          title={<Typography>{segment.scientific_name}</Typography>}
          arrow
          enterDelay={500}
          followCursor={true}
        >
          <g>
            <path
              key={segment.taxon_id}
              fill={
                segment.cats && segment.cats.length == 1
                  ? colors[segment.cats[0]]
                  : segment.color
              }
              onPointerEnter={(e) => highlightSegment(segment)}
              onPointerOut={(e) => highlightSegment()}
              {...longPress()}
              stroke="white"
              strokeWidth={strokeWidth}
              d={segment.arc}
            />
          </g>
        </Tooltip>,
      );

      if (!hideErrorBars && segment.valueBar) {
        paths.push(
          <path
            key={`bar-${segment.taxon_id}`}
            fill={color}
            stroke={"none"}
            d={segment.valueBar}
            onPointerEnter={(e) => highlightSegment(segment)}
            onPointerOut={(e) => highlightSegment()}
            {...longPress()}
          />,
        );
      }
      if (segment.valueArc) {
        paths.push(
          <Tooltip
            key={`value-${segment.taxon_id}`}
            title={
              <div>
                <div>{segment.scientific_name}</div>
                <div>{segment.valueLabel}</div>
              </div>
            }
            arrow
            enterDelay={500}
            followCursor={true}
          >
            <path
              fill={color}
              stroke={color}
              fillOpacity={0.5}
              strokeOpacity={0.75}
              d={segment.valueArc}
              onPointerEnter={(e) => highlightSegment(segment)}
              onPointerOut={(e) => highlightSegment()}
              {...longPress()}
            />
          </Tooltip>,
        );
      }
    });
  }

  let highlightPath;
  if (highlight) {
    highlightPath = (
      <g key={"highlight"} style={{ pointerEvents: "none" }}>
        <path
          fill={"white"}
          strokeWidth={3}
          stroke={highlight.highlightColor}
          fillOpacity={0.25}
          d={highlight.highlight}
        />
        {highlight.valueArc && (
          <path
            fill={"white"}
            strokeWidth={3}
            stroke={highlight.highlightColor}
            fillOpacity={0.5}
            strokeOpacity={0.75}
            d={highlight.valueArc}
          />
        )}
        {highlight.valueBar && !hideErrorBars && (
          <path
            fill={"white"}
            strokeWidth={3}
            stroke={highlight.highlightColor}
            fillOpacity={0.5}
            strokeOpacity={0.75}
            d={highlight.valueBar}
          />
        )}
      </g>
    );
  }
  let text = [];
  let defs = [];
  if (labels) {
    labels.forEach((label) => {
      defs.push(
        <path
          key={label.taxon_id}
          id={`${label.taxon_id}-label-path`}
          style={{ pointerEvents: "none" }}
          d={label.arc}
        />,
      );
      text.push(
        <text
          key={label.taxon_id}
          fill={"white"}
          style={{ pointerEvents: "none" }}
          textAnchor="middle"
          fontSize={label.labelScale > 1 && `${label.labelScale * pointSize}px`}
        >
          <textPath
            xlinkHref={`#${label.taxon_id}-label-path`}
            startOffset="50%"
            alignmentBaseline="central"
            dominantBaseline="alphabetic"
          >
            {label.scientific_name}
          </textPath>
        </text>,
      );
    });
  }

  let ticksText = [];
  let tickRings = [];
  if (ticks && ticks.length > 0 && ticks[0].radius) {
    ticks.forEach((tick, i) => {
      ticksText.push(
        <g key={tick.value}>
          <text
            fill={"#333333"}
            style={{ pointerEvents: "none" }}
            textAnchor="start"
            alignmentBaseline="middle"
            dominantBaseline="middle"
            x={8}
            y={tick.radius}
          >
            {tick.label}
          </text>
          <line
            x1={0}
            y1={tick.radius}
            x2={5}
            y2={tick.radius}
            fill={"none"}
            stroke={"#333333"}
            strokeWidth={2}
            strokeLinecap={"round"}
          ></line>
        </g>,
      );
      if (tick.arc) {
        tickRings.push(
          <path
            key={tick.value}
            fill={"none"}
            stroke={"#999999"}
            strokeWidth={1}
            strokeDasharray={"2 4"}
            strokeLinecap={"round"}
            d={tick.arc}
          />,
        );
      }
    });
    ticksText.push(
      <line
        key={"axis"}
        x1={0}
        y1={ticks[0].radius}
        x2={0}
        y2={ticks[ticks.length - 1].radius}
        fill={"none"}
        stroke={"#333333"}
        strokeWidth={2}
        strokeLinecap={"round"}
      ></line>,
    );
  }

  let phylopicElements = [];
  for (let [taxonId, opts] of Object.entries(phylopics)) {
    if (!taxonId) {
      continue;
    }
    let { x, y, angle, scientificName, width, height, arc } = opts;
    phylopicElements.push(
      <g key={taxonId}>
        <Phylopics
          taxonId={taxonId}
          scientificName={scientificName}
          maxHeight={height}
          maxWidth={width}
          fixedRatio={1}
          showAncestral={false}
          sourceColors={false}
          embed={true}
          transform={`translate(${x}, ${y}) rotate(${angle})`}
        />
      </g>,
    );
  }

  return (
    <div
      style={{
        height: divHeight,
        overflow: "visible",
        textAlign: "center",
      }}
    >
      <svg
        preserveAspectRatio="xMinYMin"
        ref={anchorRef}
        height={height}
        width={width}
        viewBox={`${dimensions.x} ${dimensions.y} ${dimensions.width} ${dimensions.height}`}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <defs>{defs}</defs>
        <g
          transform="translate(500, 500)"
          style={{
            fontFamily:
              '"Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: `${pointSize}px`,
          }}
        >
          {tickRings}
          {paths}
          {text}
          {ticksText}
          {highlightPath}
          {phylopicElements}
        </g>
      </svg>
    </div>
  );
};

export default compose(withTypes, withColors)(ReportTreeRings);
