import React, { useCallback, useRef, useState } from "react";
import { useLocation, useNavigate } from "@reach/router";

// import SVGDownloadButton from "./SVGDownloadButton";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
// import VariableFilter from "./VariableFilter";
import classnames from "classnames";
import { compose } from "recompose";
// import { formatter } from "../functions/formatter";
import { scaleLog } from "d3-scale";
import styles from "./Styles.scss";
import { useLongPress } from "use-long-press";
// import withRecord from "../hocs/withRecord";
// import withSearch from "../hocs/withSearch";
// import withSummary from "../hocs/withSummary";
// import withTree from "../hocs/withTree";
import withTypes from "../hocs/withTypes";

const ReportTreeRings = ({
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
  arcs,
  labels,
  handleNavigation,
  handleSearch,
  width,
  height,
  pointSize,
  plotHeight,
}) => {
  if (!arcs || arcs.length == 0) {
    return null;
  }
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
  // if (count > 10000) {
  //   return (
  //     <div className={css}>
  //       <div className={styles.header} style={{ cursor: "default" }}>
  //         <span className={styles.title}>Tree</span>
  //         <span>
  //           {" "}
  //           (not available for queries returning over 10,000 results)
  //         </span>
  //       </div>
  //     </div>
  //   );
  // }
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
  return (
    <div
      style={{
        height: divHeight,
        overflow: "visible",
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
