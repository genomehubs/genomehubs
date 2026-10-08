import { useCallback, useEffect, useRef, useState } from "react";

import PhylopicAttributions from "./PhylopicAttributions";
import Phylopics from "./PhyloPics";
import Tooltip from "#wrappers/Tooltip";
import Typography from "@mui/material/Typography";
import { compose } from "redux";
import { scaleLog } from "d3-scale";
import setColors from "#functions/setColors";
import { useLongPress } from "use-long-press";
import { useSelector } from "react-redux";
import withColors from "#hocs/withColors";
import withPhylopicsById from "#hocs/withPhylopicsById";
import withTheme from "#hocs/withTheme";
import withTypes from "#hocs/withTypes";

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
  colorScheme,
  theme,
  hideSourceColors,
  hideErrorBars,
  hideAncestralBars,
  cats,
  phylopics,
  phylopicRank,
  phylopicSize,
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

  let greyColor = colorScheme[theme].shadeColor;

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

  let strokeWidth = strokeScale((arcs || 1).length * 2);

  let paths = [];
  let backgroundColor = colorScheme[theme].lightColor;
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
                  : segment.color || greyColor
              }
              onPointerEnter={(e) => highlightSegment(segment)}
              onPointerOut={(e) => highlightSegment()}
              {...longPress()}
              stroke={backgroundColor}
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
          fill={backgroundColor}
          strokeWidth={3}
          stroke={highlight.highlightColor}
          fillOpacity={0.25}
          d={highlight.highlight}
        />
        {highlight.valueArc && (
          <path
            fill={backgroundColor}
            strokeWidth={3}
            stroke={highlight.highlightColor}
            fillOpacity={0.5}
            strokeOpacity={0.75}
            d={highlight.valueArc}
          />
        )}
        {highlight.valueBar && !hideErrorBars && (
          <path
            fill={backgroundColor}
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
            dominantBaseline="central"
          >
            {label.scientific_name}
          </textPath>
        </text>,
      );
    });
  }
  defs.push(
    <filter id="invertFilter" key="invertFilter">
      <feComponentTransfer>
        <feFuncR type="table" tableValues="1 0" />
        <feFuncG type="table" tableValues="1 0" />
        <feFuncB type="table" tableValues="1 0" />
      </feComponentTransfer>
    </filter>,
  );
  defs.push(
    <filter id="brightnessFilter" key="brightnessFilter">
      <feComponentTransfer>
        <feFuncR type="linear" slope="0.9" />
        <feFuncG type="linear" slope="0.9" />
        <feFuncB type="linear" slope="0.9" />
      </feComponentTransfer>
    </filter>,
  );
  defs.push(
    <filter id="combinedFilter" key="combinedFilter">
      <feComponentTransfer>
        <feFuncR type="table" tableValues="1 0" />
        <feFuncG type="table" tableValues="1 0" />
        <feFuncB type="table" tableValues="1 0" />
      </feComponentTransfer>
      <feComponentTransfer>
        <feFuncR type="linear" slope="0.9" />
        <feFuncG type="linear" slope="0.9" />
        <feFuncB type="linear" slope="0.9" />
      </feComponentTransfer>
    </filter>,
  );

  let ticksText = [];
  let tickRings = [];
  const loadedPhylopics = useSelector((state) => state.phylopics?.byId || {});
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
  let taxIds = {};
  let placed = [];

  const angularGap = (a, b) => {
    const delta = a - b;
    return Math.abs(Math.atan2(Math.sin(delta), Math.cos(delta)));
  };

  const getPhylopicAspectRatio = (taxonId, fallback = 1) => {
    const ratio = Number(loadedPhylopics[taxonId]?.ratio || fallback);
    return Number.isFinite(ratio) && ratio > 0 ? ratio : fallback;
  };

  const getImageFootprint = (entry) => {
    const ratio = getPhylopicAspectRatio(entry.taxonId, 1);
    const width = entry.width || 0;
    const height = entry.height || 0;
    const isWide = ratio > 1.5;
    const displayWidth = isWide
      ? Math.max(width, height * Math.min(ratio, 2.5) * 0.85)
      : Math.max(width, height);
    const displayHeight = isWide
      ? Math.max(height, (width / Math.max(ratio, 1.5)) * 0.85)
      : Math.max(height, width * 0.8);

    return {
      width: displayWidth,
      height: displayHeight,
      isWide,
    };
  };

  const positionsOverlap = (candidate, other) => {
    const candidateAngle = Math.atan2(candidate.y, candidate.x);
    const otherAngle = Math.atan2(other.y, other.x);
    const gap = angularGap(candidateAngle, otherAngle);
    const candidateFootprint = getImageFootprint(candidate);
    const otherFootprint = getImageFootprint(other);
    const separation = Math.max(
      Math.hypot(candidate.x - other.x, candidate.y - other.y),
      0,
    );

    const effectiveCandidate = {
      width: candidateFootprint.width * 0.9,
      height: candidateFootprint.height * 0.9,
      isWide: candidateFootprint.isWide,
    };
    const effectiveOther = {
      width: otherFootprint.width * 0.9,
      height: otherFootprint.height * 0.9,
      isWide: otherFootprint.isWide,
    };

    if (effectiveCandidate.isWide && effectiveOther.isWide) {
      const requiredSeparation =
        (effectiveCandidate.height + effectiveOther.height) / 2 + 10;
      return gap < Math.PI * 0.8 && separation < requiredSeparation;
    }

    const candidateHalfWidth = effectiveCandidate.width / 2;
    const candidateHalfHeight = effectiveCandidate.height / 2;
    const otherHalfWidth = effectiveOther.width / 2;
    const otherHalfHeight = effectiveOther.height / 2;
    const requiredSeparation =
      Math.max(candidateHalfWidth, candidateHalfHeight) +
      Math.max(otherHalfWidth, otherHalfHeight) +
      4;
    return gap < Math.PI && separation < requiredSeparation;
  };

  const applyRadialOffset = (position, offset) => {
    if (!position || !Number.isFinite(offset) || offset <= 0) {
      return position;
    }
    const magnitude = Math.hypot(position.x || 0, position.y || 0);
    if (!magnitude) {
      return position;
    }
    const maxCanvasRadius = Math.max(
      0,
      Math.min(width || 1000, height || 1000) / 2,
    );
    const nextMagnitude = Math.min(
      maxCanvasRadius,
      Math.max(0, magnitude + offset),
    );
    const directionX = (position.x || 0) / magnitude;
    const directionY = (position.y || 0) / magnitude;
    return {
      ...position,
      x: directionX * nextMagnitude,
      y: directionY * nextMagnitude,
    };
  };

  const resolveCenteredPosition = (candidate, fallback, entries) => {
    if (!entries.length || !candidate || !fallback) {
      return {
        position: candidate || fallback,
        offsetApplied: false,
        scale: 1,
      };
    }

    const scales = [1, 0.9, 0.8, 0.7, 0.6, 0.5];
    const maxCanvasRadius = Math.max(
      0,
      Math.min(width || 1000, height || 1000) / 2,
    );

    for (const scale of scales) {
      const scaledCandidate = {
        ...candidate,
        width: (candidate.width || 0) * scale,
        height: (candidate.height || 0) * scale,
      };
      const scaledFallback = {
        ...fallback,
        width: (fallback.width || 0) * scale,
        height: (fallback.height || 0) * scale,
      };

      if (!entries.some((entry) => positionsOverlap(scaledCandidate, entry))) {
        return { position: scaledCandidate, offsetApplied: false, scale };
      }

      const maxOutwardOffset = Math.max(
        0,
        maxCanvasRadius -
          Math.hypot(scaledCandidate.x || 0, scaledCandidate.y || 0),
      );
      for (let offset = 2; offset <= maxOutwardOffset; offset += 2) {
        const trial = applyRadialOffset(scaledCandidate, offset);
        if (!entries.some((entry) => positionsOverlap(trial, entry))) {
          return { position: trial, offsetApplied: true, scale };
        }
      }

      const fallbackOutwardOffset = Math.max(
        0,
        maxCanvasRadius -
          Math.hypot(scaledFallback.x || 0, scaledFallback.y || 0),
      );
      for (let offset = 2; offset <= fallbackOutwardOffset; offset += 2) {
        const trial = applyRadialOffset(scaledFallback, offset);
        if (!entries.some((entry) => positionsOverlap(trial, entry))) {
          return { position: trial, offsetApplied: true, scale };
        }
      }
    }

    return { position: fallback, offsetApplied: false, scale: 1 };
  };

  const PhylopicMarker = withPhylopicsById(
    ({
      taxonId,
      scientificName,
      x,
      y,
      angle,
      width,
      height,
      arc,
      imageX = x,
      imageY = y,
      imageAngle = angle,
      phylopicById,
      fetchPhylopic,
      stroke,
    }) => {
      useEffect(() => {
        if (!phylopicById) {
          fetchPhylopic({ taxonId, scientificName });
        }
      }, [taxonId, scientificName, phylopicById, fetchPhylopic]);

      const hasImage = Boolean(phylopicById?.dataUri || phylopicById?.hasImage);
      if (!phylopicById?.ratio || !hasImage) {
        return null;
      }

      return (
        <g key={taxonId}>
          {arc && (
            <path
              fill={"none"}
              stroke={stroke}
              strokeWidth={4}
              strokeLinejoin="round"
              d={arc}
            ></path>
          )}
          <g
            transform={`translate(${imageX}, ${imageY}) rotate(${imageAngle})`}
          >
            <Phylopics
              taxonId={taxonId}
              scientificName={scientificName}
              maxHeight={height}
              maxWidth={width}
              fixedRatio={1}
              showAncestral={false}
              sourceColors={false}
              embed={true}
              transform={"translate(0, 0)"}
            />
          </g>
        </g>
      );
    },
  );

  let ctr = 0;
  for (let [taxonId, opts] of Object.entries(phylopics)) {
    if (!taxonId) {
      continue;
    }
    // Do not block the whole phylopic layer on the nested fetch. The layout can
    // re-run when the live ratio arrives in Redux, but we should still render the
    // current image instead of suppressing it entirely.
    let {
      x,
      y,
      angle,
      scientificName,
      width,
      height,
      arc,
      standard,
      centered,
    } = opts;

    const candidatePositions = [centered, standard, { x, y, angle }].filter(
      Boolean,
    );
    let chosenPosition = candidatePositions[0];
    let offsetApplied = false;
    for (const candidate of candidatePositions) {
      const overlaps = placed.some((entry) =>
        positionsOverlap(candidate, entry),
      );
      if (!overlaps) {
        chosenPosition = candidate;
        break;
      }
    }

    let renderScale = 1;
    if (placed.length) {
      const preferredCandidate = centered || chosenPosition || standard;
      const resolved = resolveCenteredPosition(
        preferredCandidate,
        standard || chosenPosition || { x, y, angle },
        placed,
      );
      offsetApplied = !!resolved.offsetApplied || resolved.scale < 1;
      renderScale = resolved.scale || 1;
      chosenPosition = resolved.position;
    }

    const renderedWidth = width * renderScale;
    const renderedHeight = height * renderScale;

    placed.push({
      taxonId,
      x: chosenPosition.x,
      y: chosenPosition.y,
      width: renderedWidth,
      height: renderedHeight,
      pixelsPerDegree: opts.pixelsPerDegree,
      centered: chosenPosition === centered,
      offsetApplied,
    });

    phylopicElements.push(
      <PhylopicMarker
        key={taxonId}
        taxonId={taxonId}
        scientificName={scientificName}
        x={x}
        y={y}
        angle={angle}
        imageX={chosenPosition.x}
        imageY={chosenPosition.y}
        imageAngle={chosenPosition.angle}
        width={renderedWidth}
        height={renderedHeight}
        arc={arc}
        stroke={greyColor}
      />,
    );
    taxIds[taxonId] = scientificName;
    ctr += 1;
  }

  let attributions = (
    <PhylopicAttributions
      taxIds={taxIds}
      embed={"svg"}
      x={0}
      fontSize={pointSize}
    />
  );

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
          transform={`translate(${dimensions.width / 2}, ${dimensions.height / 2})`}
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
        <g
          transform={`translate(${dimensions.width / 2}, ${dimensions.height})`}
          style={{
            fontFamily:
              '"Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: `${pointSize}px`,
          }}
        >
          {attributions}
        </g>
      </svg>
    </div>
  );
};

export default compose(withTypes, withTheme, withColors)(ReportTreeRings);
