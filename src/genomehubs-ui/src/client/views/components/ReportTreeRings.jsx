import React, { useCallback, useRef, useState } from "react";
import { useLocation, useNavigate } from "@reach/router";

import Tooltip from "./Tooltip";
import Typography from "@material-ui/core/Typography";
import classnames from "classnames";
import { compose } from "recompose";
import { scaleLog } from "d3-scale";
import styles from "./Styles.scss";
import { useLongPress } from "use-long-press";
import withTypes from "../hocs/withTypes";

const ReportTreeRings = ({
  arcs,
  labels,
  handleNavigation,
  handleSearch,
  width,
  height,
  pointSize,
}) => {
  if (!arcs || arcs.length == 0) {
    return null;
  }
  const [position, setPosition] = useState({
    x: undefined,
    y: undefined,
  });

  let divHeight = height;
  height = Math.min(isNaN(height) ? 100 : height, isNaN(width) ? 100 : width);
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

      paths.push(
        <Tooltip
          key={`tt-${segment.taxon_id}`}
          title={<Typography>{segment.scientific_name}</Typography>}
          onPointerMove={(e) => setPosition({ x: e.clientX, y: e.clientY })}
          PopperProps={{
            anchorEl: {
              clientHeight: 0,
              clientWidth: 0,
              getBoundingClientRect: () => ({
                top: position.y,
                left: position.x,
                right: position.x,
                bottom: position.y + 10,
                width: 0,
                height: 10,
              }),
            },
          }}
          arrow
          placement="bottom"
        >
          <path
            key={segment.taxon_id}
            fill={segment.color}
            onPointerEnter={(e) => highlightSegment(segment)}
            onPointerLeave={(e) => highlightSegment()}
            {...longPress}
            stroke="white"
            strokeWidth={strokeWidth}
            d={segment.arc}
          />
        </Tooltip>
      );
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
        </text>
      );
    });
  }

  css = undefined;
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
          {paths}
          {text}
          {highlightPath}
        </g>
      </svg>
    </div>
  );
};

export default compose(withTypes)(ReportTreeRings);
