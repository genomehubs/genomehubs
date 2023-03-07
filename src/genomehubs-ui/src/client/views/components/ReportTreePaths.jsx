import { Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import React, { useCallback, useEffect, useRef, useState } from "react";

import KonvaTooltip from "./KonvaTooltip";
import Skeleton from "@material-ui/lab/Skeleton";
import classnames from "classnames";
import { compose } from "recompose";
import formats from "../functions/formats";
import { scaleLinear } from "d3-scale";
import stringLength from "../functions/stringLength";
import styles from "./Styles.scss";
import { useScrollPosition } from "@n8tb1t/use-scroll-position";
import withColors from "../hocs/withColors";
import withReportTerm from "../hocs/withReportTerm";
import withTypes from "../hocs/withTypes";

const ReportTreePaths = ({
  lines,
  handleNavigation,
  handleSearch,
  width,
  height,
  plotHeight,
  charHeight,
  pointSize,
  locations,
  other,
  maxTip,
  yField,
  valueScale,
  maxWidth,
  dataWidth,
  hidePreview,
  reportTerm,
  setReportTerm,
  colors,
  levels,
}) => {
  if (!lines || lines.length == 0) {
    return null;
  }
  let rootRank;
  if (lines.length >= 2) {
    rootRank = lines[lines.length - 2].taxon_rank;
  } else {
    rootRank = lines[0].taxon_rank;
  }
  pointSize *= 1;
  let strokeWidth = pointSize / 10 + 0.5;

  let divHeight = height;
  let divWidth = width;
  height = plotHeight;

  const noHighlight = {
    main: undefined,
    overview: undefined,
    preview: undefined,
  };

  const [highlight, setHighlight] = useState(noHighlight);
  const [tooltip, setTooltip] = useState({});
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [previewOffset, setPreviewOffset] = useState({ x: 0, y: 0 });
  const [scrollBarWidth, setScrollBarWidth] = useState(0);
  const [scale, setScale] = useState(
    divWidth ? divWidth / (maxWidth + dataWidth + 10 || divWidth) : 1
  );
  const padding = 500;
  let previewScale = 1;
  let previewWidth = maxWidth + dataWidth + 10;
  let previewHeight = plotHeight;
  let previewRatio = 1;
  let previewDivHeight = divHeight;

  const scrollContainerRef = useRef(null);
  const stageRef = useRef(null);
  const previewRef = useRef(null);
  let maxY = plotHeight - divHeight + 10;
  let yScale = scaleLinear();
  let previewYScale = scaleLinear();
  let globalYScale = scaleLinear();
  let globalYClickScale = scaleLinear();

  useEffect(() => {
    setScale(divWidth ? divWidth / (maxWidth + dataWidth + 10 || divWidth) : 1);
  }, [maxWidth, dataWidth, divWidth]);

  // Element scroll position
  useScrollPosition(
    ({ currPos }) => {
      let y = Math.min(currPos.y / scale, maxY);
      let previewY = 0;
      previewY = yScale(currPos.y / scale);
      setPreviewOffset({
        x: previewOffset.x,
        y: previewY,
      });
      setScrollPosition({
        x: currPos.x,
        y,
      });
    },
    [],
    stageRef,
    false,
    100,
    scrollContainerRef
  );

  useEffect(() => {
    let mounted = true;
    if (reportTerm && locations[reportTerm.toLowerCase()]) {
      if (mounted) {
        let x = scrollPosition.x;
        let y = locations[reportTerm.toLowerCase()].y - divHeight / 2;
        y = Math.max(0, Math.min(y, maxY));
        y *= scale;
        setScrollPosition({
          x,
          y,
        });
        scrollContainerRef.current.scrollLeft = x;
        scrollContainerRef.current.scrollTop = y;
      }
    }
    return () => {
      mounted = false;
    };
  }, [reportTerm]);

  const handleDragStart = () => {};
  const handleDragMove = (event, limit) => {
    event.target.x(0);
    if (limit) {
      event.target.y(Math.max(0, Math.min(event.target.y(), limit)));
    }
  };
  const handleDragEnd = (event) => {
    let x = scrollPosition.x;
    let y = event.target.y() * scale;
    setScrollPosition({
      x,
      y,
    });
    scrollContainerRef.current.scrollLeft = x;
    scrollContainerRef.current.scrollTop = y;
  };

  const handleGlobalDragEnd = (event, limit) => {
    let x = scrollPosition.x;
    let y = event.target.y();
    if (limit) {
      event.target.y(Math.max(0, Math.min(event.target.y(), limit)));
    }
    y = globalYScale.invert(y) * scale;
    setScrollPosition({
      x,
      y,
    });
    scrollContainerRef.current.scrollLeft = x;
    scrollContainerRef.current.scrollTop = y;
  };

  const handlePreviewClick = ({ evt, target }) => {
    const stage = target.getStage();
    const offset = { x: stage.x(), y: stage.y() };
    let x = scrollPosition.x;
    let y = evt.layerY - offset.y;
    y = previewYScale(y) * scale;
    y = Math.max(Math.min(y, maxY * scale), 0);
    setScrollPosition({
      x,
      y,
    });
    scrollContainerRef.current.scrollLeft = x;
    scrollContainerRef.current.scrollTop = y;
  };

  const handleNavigate = ({ root, name, depth, rank }) => {
    if (name != "parent") {
      setReportTerm(name.toLowerCase());
    }
    handleNavigation({ root, name, depth, rank, rootRank });
  };

  const handleGlobalClick = ({ evt, target }) => {
    const stage = target.getStage();
    const offset = { x: stage.x(), y: stage.y() };
    let x = scrollPosition.x;
    let y = evt.layerY - offset.y;
    y = globalYClickScale(y) * scale;
    y = Math.max(Math.min(y, maxY * scale), 0);
    setScrollPosition({
      x,
      y,
    });
    scrollContainerRef.current.scrollLeft = x;
    scrollContainerRef.current.scrollTop = y;
  };

  // const anchorRef = useRef(null);
  const treeRef = useRef(null);
  const [treeDimensions, setTreeDimensions] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const getDimensions = (myRef) => {
    return treeDimensions;
    myRef.current ? myRef.current.getBBox() : treeDimensions;
  };
  useEffect(() => {
    if (treeRef.current) {
      let dimensions = getDimensions(treeRef);
      setTreeDimensions(dimensions);
    }
    if (stageRef.current) {
      setScrollBarWidth(
        stageRef.current.offsetWidth - stageRef.current.clientWidth
      );
    }
  }, [treeRef, stageRef]);

  const showTooltip = (e, segment, field) => {
    if (segment) {
      const container = e.target.getStage().container();
      container.style.cursor = "pointer";
    } else {
      const container = e.target.getStage().container();
      container.style.cursor = "default";
    }
    setTooltip({ e, segment, field });
  };

  const [paths, setPaths] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [labels, setLabels] = useState([]);
  const [valueTicks, setValueTicks] = useState({});
  const [cats, setCats] = useState([]);
  const [regions, setRegions] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [bars, setBars] = useState([]);
  const [errorBars, setErrorBars] = useState([]);
  const [overview, setOverview] = useState([]);
  const [portion, setPortion] = useState(0);
  const updateCache = (index, value) => {
    const updatedCache = [...portionCache];
    updatedCache[index] = value;
    setPortionCache(updatedCache);
  };
  const [portionCache, setPortionCache] = useState([]);

  const overviewWidth = 15;
  const overviewHeight = divHeight;
  const overviewScale = scaleLinear()
    .domain([10, plotHeight - 10])
    .range([0, overviewHeight]);
  const portionHeight = 10000;
  const portionOverlap = 10000;

  useEffect(() => {
    let visiblePortion = Math.floor(
      Math.max(0, scrollPosition.y) / portionHeight
    );
    if (visiblePortion != portion) {
      setPortion(visiblePortion);
    }
  }, [scrollPosition.y]);

  let mouseDownTimeout;

  const plusRadius = charHeight / 2 - 3;
  const plusPoints = [
    -plusRadius,
    0,
    plusRadius,
    0,
    0,
    0,
    0,
    plusRadius,
    0,
    -plusRadius,
  ];

  useEffect(() => {
    if (lines) {
      let newPaths = [];
      let newNodes = [];
      let newLabels = [];
      let newRegions = [];
      let newOverview = [];
      let newConnectors = [];
      let newBars = [];
      let newErrorBars = [];
      let newCats = [];
      if (valueScale) {
        let ticks = valueScale.ticks();
        let top = charHeight + charHeight / 1.8;
        let tickLines = ticks.map((tick, i) => {
          let end = i == 0 || i == ticks.length - 1;
          return (
            <Line
              key={`t-${tick}`}
              points={[
                valueScale(tick),
                top - (end ? 3 : 0),
                valueScale(tick),
                plotHeight,
              ]}
              stroke={"grey"}
              strokeWidth={end ? 1 : 0.5}
              opacity={end ? 1 : 0.5}
            />
          );
        });
        let tick = ticks[0];
        let tickLabel = formats(tick);
        let tickLabelLength = stringLength(tickLabel) * charHeight * 0.6;
        tickLines.push(
          <Text
            key={`tx-${tick}`}
            x={-tickLabelLength / 2}
            y={top - charHeight}
            width={tickLabelLength}
            fill={"grey"}
            fontSize={charHeight * 0.75}
            textAlign={"center"}
            textBaseline={"bottom"}
            text={tickLabel}
          />
        );
        tick = ticks[ticks.length - 1];
        tickLabel = formats(tick);
        tickLabelLength = stringLength(tickLabel) * charHeight * 0.6;
        tickLines.push(
          <Text
            key={`tx-${tick}`}
            x={valueScale(tick) - tickLabelLength / 2}
            y={top - charHeight}
            width={charHeight * 5}
            fill={"grey"}
            fontSize={charHeight * 0.75}
            textAlign={"center"}
            textBaseline={"bottom"}
            text={tickLabel}
          />
        );
        setValueTicks({ ticks, tickLines });
      }
      if (portionCache[portion]) {
        ({
          newNodes,
          newPaths,
          newLabels,
          newRegions,
          newConnectors,
          newBars,
          newErrorBars,
          newCats,
        } = portionCache[portion]);
      } else {
        let lowerY = portionHeight * portion - portionOverlap;
        let upperY = portionHeight * (portion + 1) + portionOverlap;

        for (let segment of lines) {
          if (
            overview.length == 0 &&
            ((segment.tip && segment.status == 1) ||
              (reportTerm &&
                reportTerm == segment.scientific_name.toLowerCase()))
          ) {
            let overviewY = overviewScale(segment.yStart);
            if (segment.tip && segment.status == 1) {
              let points;
              if (segment.value == 10) {
                points = [5, overviewY, 15, overviewY];
              } else {
                points = [
                  5 + segment.value,
                  overviewY,
                  7 + segment.value,
                  overviewY,
                ];
              }
              newOverview.push(
                <Line
                  key={`o-${segment.taxon_id}`}
                  points={points}
                  stroke={segment.color}
                  opacity={0.5}
                />
              );
            }
            if (
              reportTerm &&
              reportTerm == segment.scientific_name.toLowerCase()
            ) {
              setHighlight({
                overview: (
                  <Line
                    key={`highlight-${segment.taxon_id}`}
                    points={[5, overviewY, 15, overviewY]}
                    stroke={"yellow"}
                  />
                ),
              });
            }
          }

          if (segment.yMin > upperY || segment.yMax < lowerY) {
            continue;
          }
          newPaths.push(
            <Line
              key={`h-${segment.taxon_id}`}
              points={[
                segment.xStart,
                segment.yStart,
                segment.xEnd,
                segment.yStart,
              ]}
              strokeWidth={strokeWidth}
              stroke={segment.color}
              // strokeScaleEnabled={false}
            />
          );
          if (segment.cats) {
            if (levels[segment.cats.length]) {
              colors = levels[segment.cats.length];
            }
            segment.cats.forEach((cat, i) => {
              let xPos = segment.xEnd - charHeight * (i / 2 + 0.5);
              newCats.push(
                <Circle
                  key={`cat-${segment.taxon_id}-${cat}-${i}`}
                  x={xPos}
                  y={segment.yStart}
                  radius={charHeight / 2}
                  fill={colors[cat]}
                  stroke={colors[cat]}
                  strokeScaleEnabled={false}
                />
              );
              if (cat == other) {
                newNodes.push(
                  <Line
                    key={`plus-${segment.taxon_id}-${cat}-${i}`}
                    x={xPos}
                    y={segment.yStart}
                    points={plusPoints}
                    stroke={"white"}
                    opacity={0.75}
                  />
                );
              }
            });
          }
          if (segment.scientific_name == "parent") {
            newPaths.push(
              <Line
                key={`v-${segment.taxon_id}`}
                points={[
                  segment.xStart + 10,
                  segment.yMin,
                  segment.xStart,
                  segment.yStart,
                  segment.xStart + 10,
                  segment.yMax,
                ]}
                strokeWidth={strokeWidth}
                stroke={segment.color}
              />
            );
          } else if (segment.vLine) {
            newPaths.push(
              <Line
                key={`v-${segment.taxon_id}`}
                points={[
                  segment.xEnd,
                  segment.yMin,
                  segment.xEnd,
                  segment.yMax,
                ]}
                strokeWidth={strokeWidth}
                stroke={segment.color}
                strokeScaleEnabled={false}
              />
            );
          }
          newRegions.push(
            <Rect
              key={`r-${segment.taxon_id}`}
              x={segment.xStart}
              y={segment.yMin}
              // width={
              //   segment.tip ? segment.labelWidth + segment.width : segment.width
              // }
              width={segment.tip ? maxWidth - segment.xStart : segment.width}
              height={segment.height}
              fill={"rgba(0,0,0,0)"}
              onMouseEnter={(e) => showTooltip(e, segment)}
              onTouchStart={(e) => showTooltip(e, segment)}
              onMouseMove={(e) => showTooltip(e, segment)}
              onTouchMove={(e) => showTooltip(e, segment)}
              onMouseLeave={(e) => showTooltip(e)}
              onTouchEnd={(e) => showTooltip(e)}
              onMouseDown={(e) => {
                mouseDownTimeout = setTimeout(() => {
                  handleSearch({
                    root: segment.taxon_id,
                    name: segment.scientific_name,
                    depth: segment.depth,
                    rank: segment.taxon_rank,
                    rootRank,
                  });
                }, 500);
              }}
              onMouseUp={() => {
                clearTimeout(mouseDownTimeout);
                handleNavigate({
                  root: segment.taxon_id,
                  name: segment.scientific_name,
                  depth: segment.depth,
                  rank: segment.taxon_rank,
                  rootRank,
                });
              }}
            />
          );
          if (
            segment.scientific_name == "parent" ||
            (!segment.tip && segment.childCount == 1)
          ) {
            newNodes.push(
              <Circle
                x={segment.xEnd}
                y={segment.yStart}
                radius={2}
                fill={segment.color}
                stroke={segment.color}
                key={`c-${segment.taxon_id}`}
              />
            );
          }

          if (segment.label) {
            if (
              reportTerm &&
              reportTerm == segment.scientific_name.toLowerCase()
            ) {
              let labelWidth = segment.labelWidth || segment.width;
              setHighlight({
                ...highlight,
                main: (
                  <Rect
                    key={`tr-${segment.taxon_id}`}
                    x={segment.tip ? maxTip + 9 : segment.xEnd - labelWidth - 6}
                    y={segment.tip ? segment.yMin - 1 : segment.yStart - 12}
                    width={labelWidth}
                    height={charHeight}
                    fill={"yellow"}
                  />
                ),
                preview: (
                  <Rect
                    x={
                      segment.tip
                        ? segment.xEnd - 10
                        : segment.xEnd - labelWidth - 10
                    }
                    y={segment.yStart - charHeight}
                    width={labelWidth + 20}
                    height={charHeight * 2}
                    fill={"yellow"}
                  />
                ),
              });
            }
            newLabels.push(
              <Text
                key={`t-${segment.taxon_id}`}
                text={segment.label}
                fontSize={pointSize * 1}
                // x={segment.tip ? segment.xEnd + 10 : segment.xStart - 6}
                x={segment.tip ? maxTip + 10 : segment.xStart - 6}
                y={segment.tip ? segment.yMin : segment.yStart - pointSize}
                width={segment.tip ? segment.labelWidth : segment.width}
                height={segment.height}
                fill={segment.color}
                align={segment.tip ? "left" : "right"}
                verticalAlign={segment.tip ? "middle" : "top"}
              />
            );
            if (segment.tip) {
              newConnectors.push(
                <Line
                  key={`cl-${segment.taxon_id}`}
                  points={[
                    maxTip,
                    segment.yStart,
                    segment.xEnd + 10,
                    segment.yStart,
                  ]}
                  strokeWidth={strokeWidth}
                  stroke={"#dddddd"}
                  dash={[2, 5]}
                />
              );
              if (segment.bar && segment.bar.length > 0) {
                newBars.push(
                  <Rect
                    key={`val-${segment.taxon_id}`}
                    x={0}
                    // y={segment.yMin}
                    y={segment.yStart - charHeight / 2}
                    width={segment.bar[0] + 1}
                    height={charHeight}
                    fill={segment.color}
                  />
                );
                newRegions.push(
                  <Rect
                    key={`rval-${segment.taxon_id}`}
                    x={maxWidth}
                    y={segment.yMin}
                    // width={
                    //   segment.tip ? segment.labelWidth + segment.width : segment.width
                    // }
                    width={maxWidth - maxTip}
                    height={segment.height}
                    fill={"rgba(0,0,0,0)"}
                    onMouseEnter={(e) => showTooltip(e, segment, yField)}
                    onTouchStart={(e) => showTooltip(e, segment, yField)}
                    onMouseMove={(e) => showTooltip(e, segment, yField)}
                    onTouchMove={(e) => showTooltip(e, segment, yField)}
                    onMouseLeave={(e) => showTooltip(e)}
                    onTouchEnd={(e) => showTooltip(e)}
                    onMouseDown={(e) => {
                      mouseDownTimeout = setTimeout(() => {
                        handleSearch({
                          root: segment.taxon_id,
                          name: segment.scientific_name,
                          depth: segment.depth,
                          rank: segment.taxon_rank,
                        });
                      }, 500);
                    }}
                    onMouseUp={() => {
                      clearTimeout(mouseDownTimeout);
                      handleNavigate({
                        root: segment.taxon_id,
                        name: segment.scientific_name,
                        depth: segment.depth,
                        rank: segment.taxon_rank,
                      });
                    }}
                  />
                );
                if (
                  segment.bar.length >= 2 &&
                  segment.bar[1] < segment.bar[0] - 1
                ) {
                  newErrorBars.push(
                    <Line
                      key={`max-${segment.taxon_id}`}
                      points={[
                        segment.bar[0],
                        segment.yStart,
                        segment.bar[2],
                        segment.yStart,
                        segment.bar[2],
                        segment.yStart - charHeight / 4,
                        segment.bar[2],
                        segment.yStart + charHeight / 4,
                      ]}
                      stroke={segment.color}
                    />
                  );
                  if (
                    segment.bar.length >= 2 &&
                    segment.bar[0] < segment.bar[2] - 1
                  ) {
                    newErrorBars.push(
                      <Line
                        key={`min-${segment.taxon_id}`}
                        points={[
                          segment.bar[0],
                          segment.yStart,
                          segment.bar[1],
                          segment.yStart,
                          segment.bar[1],
                          segment.yStart - charHeight / 4,
                          segment.bar[1],
                          segment.yStart + charHeight / 4,
                        ]}
                        stroke={"white"}
                      />
                    );
                  }
                }
              }
            }
          }
        }
        updateCache(portion, {
          newNodes,
          newPaths,
          newLabels,
          newRegions,
          newConnectors,
          newBars,
          newErrorBars,
          newCats,
        });
      }

      setNodes(newNodes);
      setPaths(newPaths);
      setLabels(newLabels);
      setRegions(newRegions);
      setConnectors(newConnectors);
      setBars(newBars);
      setErrorBars(newErrorBars);
      setCats(newCats);
      if (newOverview.length > 0) {
        setOverview(newOverview);
      }
    }
  }, [lines, portion]);

  useEffect(() => {
    if (locations[reportTerm]) {
      let { x, y, tip, width } = locations[reportTerm];
      let overviewY = overviewScale(y);
      setHighlight({
        main: (
          <Rect
            x={tip ? maxTip + 9 : x + 6}
            y={tip ? y - charHeight / 2 - 1 : y - 12}
            width={tip ? width : width - 12}
            height={charHeight}
            fill={"yellow"}
          />
        ),
        overview: (
          <Line points={[5, overviewY, 15, overviewY]} stroke={"yellow"} />
        ),
        preview: (
          <Rect
            x={tip ? x + tip - 10 : x - 10}
            y={y - charHeight}
            width={tip ? width + 20 : width + 20}
            height={charHeight * 2}
            fill={"yellow"}
          />
        ),
      });
    } else {
      setHighlight(noHighlight);
    }
  }, [reportTerm]);

  let index = "";
  previewHeight = Math.min(10000, plotHeight);
  previewRatio = previewHeight / plotHeight;
  previewScale = divHeight / previewHeight;
  previewWidth = previewScale * divWidth;
  if (previewWidth > divWidth / 8) {
    previewWidth = divWidth / 8 / scale;
    previewScale = previewWidth / divWidth;
    previewDivHeight = previewScale * previewHeight;
  }

  yScale.domain([0, plotHeight - divHeight]).range([0, divHeight]);

  globalYScale
    .domain([0, plotHeight - divHeight])
    .range([0, divHeight - divHeight * previewRatio]);
  globalYClickScale
    .domain([0, divHeight])
    .range([0 - divHeight / 2, plotHeight - divHeight / 2]);

  previewYScale = scaleLinear()
    .domain([0, previewDivHeight / previewRatio])
    .range([0 - divHeight / 2, plotHeight - divHeight / 2]);

  let preview;

  if (!hidePreview && plotHeight > divHeight * 1.5) {
    let globalPosition;
    if (previewHeight < plotHeight) {
      globalPosition = (
        <div
          style={{
            height: previewDivHeight,
            overflow: "hidden",
            width: overviewWidth,
            position: "absolute",
            top: 0,
            left: -overviewWidth,
            pointerEvents: "none",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              height: previewDivHeight,
              width: overviewWidth,
              position: "absolute",
              right: 0,
              pointerEvents: "auto",
              cursor: "pointer",
            }}
          >
            <Stage
              width={overviewWidth}
              height={previewDivHeight}
              pixelRatio={1}
            >
              <Layer>
                <Group>
                  {overview}
                  {highlight.overview}
                  <Rect
                    x={5}
                    width={10}
                    y={0}
                    height={previewDivHeight}
                    fill={"rgba(0,0,0,0)"}
                    onClick={handleGlobalClick}
                  />
                </Group>
                <Group
                  x={0}
                  // width={overviewWidth}
                  y={globalYScale(scrollPosition.y)}
                  // height={previewDivHeight * previewRatio}
                  // fill={"rgba(125,125,125,0.5)"}
                  onClick={handleGlobalClick}
                  draggable
                  onDragStart={handleDragStart}
                  onDragMove={(e) =>
                    handleDragMove(
                      e,
                      divHeight - previewDivHeight * previewRatio
                    )
                  }
                  onDragEnd={(e) =>
                    handleGlobalDragEnd(
                      e,
                      divHeight - previewDivHeight * previewRatio
                    )
                  }
                >
                  <Rect
                    x={0}
                    width={overviewWidth - 10}
                    y={0}
                    height={previewDivHeight * previewRatio}
                    fill={"rgba(125,125,125,0.5)"}
                  />
                  <Rect
                    x={overviewWidth - 10}
                    width={10}
                    y={0}
                    height={previewDivHeight * previewRatio}
                    fill={"rgba(125,125,125,0.1)"}
                  />
                </Group>
              </Layer>
            </Stage>
          </div>
        </div>
      );
    }
    preview = (
      <div
        style={{
          height: previewDivHeight,
          overflow: "visible",
          width: previewWidth,
          position: "absolute",
          top: 0,
          left: -previewWidth,
        }}
      >
        <div
          style={{
            height: previewDivHeight,
            overflow: "hidden",
            width: previewWidth,
            position: "absolute",
            top: 0,
            right: 0,
            border: "rgba(0,0,0,0.1) solid 1px",
            borderRight: "none",
            boxSizing: "border-box",
            pointerEvents: "none",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              height: previewDivHeight,
              width: previewWidth,
              position: "absolute",
              right: 0,
              top: 0,
            }}
            ref={previewRef}
          >
            <Stage
              width={previewWidth}
              height={previewDivHeight}
              y={previewOffset.y - previewOffset.y / previewRatio}
              scaleX={previewScale}
              scaleY={previewScale}
              style={{ pointerEvents: "auto" }}
              pixelRatio={1}
            >
              <Layer>
                <Group>{paths}</Group>
                {highlight.preview}
                <Group>{cats}</Group>
                <Group x={maxTip + 10}>{bars}</Group>
                <Rect
                  x={0}
                  width={maxWidth + dataWidth}
                  y={0}
                  height={plotHeight}
                  fill={"rgba(0,0,0,0)"}
                  onClick={handlePreviewClick}
                />
              </Layer>
              <Layer>
                <Rect
                  x={0}
                  width={maxWidth + dataWidth}
                  y={yScale.invert(previewOffset.y)}
                  height={divHeight / scale}
                  fill={"rgba(0,0,255,0.1)"}
                  draggable={true}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={(e) => handleDragEnd(e, maxY)}
                  onClick={({ evt }) => {
                    evt.preventDefault();
                    evt.stopPropagation();
                  }}
                />
              </Layer>
            </Stage>
          </div>
        </div>
        {globalPosition}
      </div>
    );
  }

  let skeleton;
  if (plotHeight > divHeight + padding) {
    skeleton = (
      <div
        style={{
          height: divHeight,
          width: divWidth,
          position: "absolute",
          overflow: "hidden",
          top: 0,
          left: 0,
        }}
      >
        <Skeleton variant="rect" width={divWidth} height={divHeight} />
      </div>
    );
  }

  return (
    <div
      style={{
        height: divHeight,
        overflow: "visible",
        width: divWidth,
        position: "relative",
      }}
    >
      {skeleton}
      <div
        style={{
          height: divHeight,
          overflowY: "auto",
          overflowX: "hidden",
          width: divWidth,
          position: "absolute",
          border: "rgba(0,0,0,0.1) solid 1px",
          boxSizing: "border-box",
        }}
        ref={scrollContainerRef}
      >
        <div
          id={"scaledTreeDiv"}
          style={{
            height: plotHeight * scale,
            width: divWidth,
            position: "absolute",
            overflow: "hidden",
          }}
          ref={stageRef}
        >
          <div
            id={"stageDiv"}
            style={{
              height: divHeight + padding * 2,
              width: divWidth,
              top: scrollPosition.y * scale - padding,
              left: scrollPosition.x,
              overflowY: "hidden",
              position: "absolute",
            }}
          >
            <Stage
              id="konvaStage"
              width={divWidth}
              height={divHeight + padding * 2}
              x={-scrollPosition.x}
              y={-scrollPosition.y * scale + padding}
              scaleX={scale}
              scaleY={scale}
              pixelRatio={1}
            >
              <Layer>
                <Rect
                  x={scrollPosition.x}
                  width={divWidth / scale}
                  y={scrollPosition.y - padding}
                  height={divHeight + padding * 2}
                  fill={"white"}
                />
              </Layer>
              <Layer>
                <Group x={maxWidth}>{valueTicks.tickLines}</Group>
                <Group x={maxWidth}>{bars}</Group>
                <Group x={maxWidth}>{errorBars}</Group>
                {paths}
              </Layer>
              <Layer>
                <Group>{cats}</Group>
                {highlight.main}
                <Group>{labels}</Group>
                <Group>{connectors}</Group>
                <Group>{nodes}</Group>
              </Layer>
              <Layer>
                <KonvaTooltip {...tooltip} scale={scale} />
                <Group>{regions}</Group>
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
      {preview}
    </div>
  );
};

export default compose(withTypes, withColors, withReportTerm)(ReportTreePaths);
