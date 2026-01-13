import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  header as headerStyle,
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  resultPanel as resultPanelStyle,
  title as titleStyle,
} from "./Styles.scss";

import Tooltip from "./Tooltip";
import classnames from "classnames";
import { compose } from "redux";
import { scaleLog } from "d3-scale";
import { useLongPress } from "use-long-press";
import withTypes from "#hocs/withTypes";

const ReportTreePaths = ({
  count,
  lines,
  labels,
  handleNavigation,
  handleSearch,
  width,
  height,
  plotHeight,
}) => {
  let css = classnames(infoPanelStyle, infoPanel1ColumnStyle, resultPanelStyle);
  if (count > 10000) {
    return (
      <div className={css}>
        <div className={headerStyle} style={{ cursor: "default" }}>
          <span className={titleStyle}>Tree</span>
          <span>
            {" "}
            (not available for queries returning over 10,000 results)
          </span>
        </div>
      </div>
    );
  }
  const [position, setPosition] = useState({
    x: undefined,
    y: undefined,
  });

  let divHeight = height;
  let divWidth = width;
  height = plotHeight;
  width = 1000;
  const [dimensions, setDimensions] = useState({
    x: 0,
    y: 0,
    height: plotHeight,
    width: "1000px",
  });

  const [highlight, setHighlight] = useState();

  const anchorRef = useRef(null);
  const treeRef = useRef(null);
  const [treeDimensions, setTreeDimensions] = useState({
    x: 0,
    y: 0,
    width: "0px",
    height: "0px",
  });
  const getDimensions = (myRef) => myRef.current.getBBox();
  useEffect(() => {
    if (treeRef.current) {
      let dimensions = getDimensions(treeRef);
      if (divHeight) {
        dimensions.height = Math.min(divHeight, dimensions.height);
      }
      setTreeDimensions(dimensions);
    }
  }, [treeRef]);

  const highlightSegment = (segment) => {
    setHighlight(segment);
  };

  const strokeScale = scaleLog()
    .domain([100, 1000])
    .range([1, 0.1])
    .clamp(true);

  let strokeWidth = 0.8;

  let paths = [];
  if (lines) {
    lines.forEach((segment) => {
      const longPressCallback = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        handleSearch({
          root: segment.taxon_id,
          name: segment.scientific_name,
          depth: segment.depth,
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
          });
        },
        captureEvent: true,
        threshold: 500,
      });

      const clear = "rgba(255,255,255,0)";

      paths.push(
        <>
          <path
            stroke={segment.color}
            fill="none"
            strokeWidth={strokeWidth}
            d={segment.hLine}
          />
          {segment.vLine && (
            <path
              stroke={segment.color}
              fill="none"
              strokeWidth={strokeWidth}
              d={segment.vLine}
            />
          )}
          <circle
            r={4}
            cx={segment.xEnd}
            cy={segment.yStart}
            stroke={segment.color}
            fill={"white"}
            strokeWidth={strokeWidth * 2}
          />
          <Tooltip
            title={segment.scientific_name}
            onPointerMove={(e) => setPosition({ x: e.clientX, y: e.clientY })}
            PopperProps={{
              anchorEl: {
                clientHeight: "0px",
                clientWidth: "0px",
                getBoundingClientRect: () => ({
                  top: position.y,
                  left: position.x,
                  right: position.x,
                  bottom: position.y + 10,
                  width: "0px",
                  height: "10px",
                }),
              },
            }}
            arrow
            placement="bottom"
          >
            <g>
              {segment.label && (
                <text
                  {...longPress()}
                  fill={segment.color}
                  style={{ cursor: "pointer" }}
                  x={segment.xEnd}
                  y={segment.yStart}
                  textAnchor={segment.tip ? "start" : "end"}
                  alignmentBaseline={segment.tip ? "middle" : "bottom"}
                  dominantBaseline={segment.tip ? "alphabetic" : "bottom"}
                  transform={`translate(${segment.tip ? 10 : -6}, ${
                    segment.tip ? 0 : -2
                  })`}
                >
                  {segment.label}
                </text>
              )}
              <rect
                {...longPress}
                fill={clear}
                style={{ cursor: "pointer" }}
                x={segment.xStart}
                y={segment.yMin}
                width={segment.width}
                height={segment.height}
                stroke="none"
              />
            </g>
          </Tooltip>
        </>
      );
    });
  }

  let highlightPath;
  if (highlight) {
    highlightPath = (
      <g style={{ pointerEvents: "none" }}>
        <path
          fill={"white"}
          strokeWidth={3}
          stroke={highlight.highlightColor}
          fillOpacity={0.25}
          d={highlight.highlight}
        />
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
        />
      );
      text.push(
        <text
          fill={"white"}
          style={{ pointerEvents: "none" }}
          textAnchor="middle"
          fontSize={label.labelScale > 1 && `${label.labelScale * 10}pt`}
        >
          <textPath
            xlinkHref={`#${label.taxon_id}-label-path`}
            startOffset="50%"
            alignmentBaseline="central"
            dominantBaseline="alphabetic"
          >
            {label.scientific_name}
          </textPath>
        </text>
      );
    });
  }

  css = undefined;
  let svgWidth = divWidth ? divWidth - 20 : 0;
  return (
    <div
      style={{
        height: Math.min(
          (plotHeight * svgWidth) / (treeDimensions.width || 1) + 20,
          divHeight
        ),
        overflowY: "auto",
        overflowX: "hidden",
        width: { divWidth },
      }}
    >
      <svg
        preserveAspectRatio="xMinYMin meet"
        ref={anchorRef}
        height={(plotHeight * svgWidth) / (treeDimensions.width || 1)}
        width={svgWidth}
        viewBox={`${treeDimensions.x} ${treeDimensions.y} ${treeDimensions.width} ${treeDimensions.height}`}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <defs>{defs}</defs>
        <g
          transform="translate(0, 0)"
          style={{
            fontFamily:
              '"Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: "10pt",
          }}
          ref={treeRef}
        >
          {paths}
          {text}
          {highlightPath}
        </g>
      </svg>
    </div>
  );
};

export default compose(withTypes)(ReportTreePaths);
