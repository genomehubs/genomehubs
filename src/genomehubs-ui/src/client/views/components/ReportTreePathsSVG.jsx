import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "@reach/router";

// import Grid from "@material-ui/core/Grid";
// import ReactDOM from "react-dom";
// import SVGDownloadButton from "./SVGDownloadButton";
import Tooltip from "@material-ui/core/Tooltip";
// import VariableFilter from "./VariableFilter";
import classnames from "classnames";
import { compose } from "recompose";
// import { formatter } from "../functions/formatter";
import { scaleLog } from "d3-scale";
import styles from "./Styles.scss";
import { useLongPress } from "use-long-press";
// import useResize from "../hooks/useResize";
// import withRecord from "../hocs/withRecord";
// import withSearch from "../hocs/withSearch";
// import withSummary from "../hocs/withSummary";
// import withTree from "../hocs/withTree";
import withTypes from "../hocs/withTypes";

const ReportTreePaths = ({
  // root_id,
  // rootNode,
  // setRootNode,
  types,
  // treeRings,
  // searchTerm,
  // searchResults,
  // fetchNodes,
  // treeHighlight,
  // setTreeHighlight,
  // treeQuery,
  // setTreeQuery,
  // newickString,
  count,
  lines,
  labels,
  handleNavigation,
  handleSearch,
  width,
  height,
  plotHeight,
  reportRef,
  gridRef,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  // const [highlightParams, setHighlightParams] = useState(treeHighlight);

  // if (!searchResults.status || !searchResults.status.hasOwnProperty("hits")) {
  //   return null;
  // }
  // let { arcs, labels, maxDepth } = treeRings || {};

  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.resultPanel
  );
  // const count = searchResults.status.hits;
  if (count > 10000) {
    return (
      <div className={css}>
        <div className={styles.header} style={{ cursor: "default" }}>
          <span className={styles.title}>Tree</span>
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
    width: 1000,
  });

  const [highlight, setHighlight] = useState();

  const anchorRef = useRef(null);
  const treeRef = useRef(null);
  const [treeDimensions, setTreeDimensions] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const getDimensions = (myRef) => myRef.current.getBBox();
  useEffect(() => {
    if (treeRef.current) {
      let dimensions = getDimensions(treeRef);
      if (divHeight) dimensions.height = Math.min(divHeight, dimensions.height);
      setTreeDimensions(dimensions);
      // if (reportRef) {
      //   let container = reportRef.current;
      //   container.style.height = `${Math.max(
      //     (dimensions.height * 1000) / dimensions.width,
      //     350
      //   )}px`;
      //   let grid = gridRef.current;
      //   grid.style.height = `${Math.max(
      //     (dimensions.height * 1000) / dimensions.width,
      //     350
      //   )}px`;
      // }
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
        // <Tooltip
        //   key={segment.taxon_id}
        //   title={segment.scientific_name}
        //   onPointerMove={(e) => setPosition({ x: e.clientX, y: e.clientY })}
        //   PopperProps={{
        //     anchorEl: {
        //       clientHeight: 0,
        //       clientWidth: 0,
        //       getBoundingClientRect: () => ({
        //         top: position.y,
        //         left: position.x,
        //         right: position.x,
        //         bottom: position.y + 10,
        //         width: 0,
        //         height: 10,
        //       }),
        //     },
        //   }}
        //   arrow
        //   placement="bottom"
        // >
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
            <g>
              {segment.label && (
                <text
                  // onPointerEnter={(e) => highlightSegment(segment)}
                  // onPointerLeave={(e) => highlightSegment()}
                  {...longPress}
                  fill={segment.color}
                  style={{ cursor: "pointer" }}
                  x={segment.xEnd}
                  y={segment.yStart}
                  textAnchor={segment.tip ? "start" : "end"}
                  alignmentBaseline={segment.tip ? "middle" : "bottom"}
                  transform={`translate(${segment.tip ? 10 : -6}, ${
                    segment.tip ? 0 : -2
                  })`}
                >
                  {segment.label}
                </text>
              )}
              <rect
                // onPointerEnter={(e) => highlightSegment(segment)}
                // onPointerLeave={(e) => highlightSegment()}
                {...longPress}
                fill={clear}
                style={{ cursor: "pointer" }}
                x={segment.xStart}
                y={segment.yMin}
                width={
                  // segment.tip ? dimensions.width - segment.xStart : segment.width
                  segment.width
                }
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
          >
            {label.scientific_name}
          </textPath>
        </text>
      );
    });
  }

  // const handleHighlightChange = (e, key) => {
  //   e.stopPropagation();
  //   setHighlightParams({ ...highlightParams, [key]: e.target.value });
  // };

  // const handleHighlightUpdate = (e) => {
  //   e.stopPropagation();
  //   setTreeHighlight(highlightParams);
  //   // if (!treeQuery) {
  //   fetchTree(rootNode);
  //   // }
  //   //
  // };

  // const handleDismissTree = (e) => {
  //   e.stopPropagation();
  //   fetchNodes({});
  //   setTreeHighlight({});
  //   setTreeQuery();
  // };

  let fields = {};
  let index = "";
  // Object.keys(types).forEach((key) => {
  //   if (key == highlightParams.field) {
  //     index = key;
  //   }
  //   fields[key] = key;
  // });
  css = undefined;
  let svgHeight = treeDimensions.width
    ? divWidth < treeDimensions.width
      ? (treeDimensions.height * divWidth) / treeDimensions.width
      : treeDimensions.height
    : 0;
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
        // preserveAspectRatio="xMinYMin"
        preserveAspectRatio="xMinYMin meet"
        ref={anchorRef}
        height={(plotHeight * svgWidth) / (treeDimensions.width || 1)}
        width={svgWidth}
        viewBox={`${treeDimensions.x} ${treeDimensions.y} ${treeDimensions.width} ${treeDimensions.height}`}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <defs>{defs}</defs>
        {/* <rect
          fill={"rgba(0,0,0,0.1)"}
          x={treeDimensions.x}
          y={treeDimensions.y}
          height={treeDimensions.height}
          width={treeDimensions.width}
        /> */}
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
