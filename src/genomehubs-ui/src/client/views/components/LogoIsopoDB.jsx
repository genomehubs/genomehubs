import React, { useEffect, useState } from "react";

import { compose } from "recompose";
import { motion } from "motion/react";
import { svgPathBbox } from "svg-path-bbox";
import withColors from "#hocs/withColors";
import withTheme from "#hocs/withTheme";

const getBboxRadius = (path, cx, cy) => {
  let [x1, y1, x2, y2] = [0, 0, 0, 0];
  if (!path) {
    return {
      x1,
      y1,
      x2,
      y2,
    };
  }
  if (Array.isArray(path)) {
    path.forEach((p) => {
      const [x1_, y1_, x2_, y2_] = svgPathBbox(p);
      x1 = Math.min(x1, x1_);
      y1 = Math.min(y1, y1_);
      x2 = Math.max(x2, x2_);
      y2 = Math.max(y2, y2_);
    });
  } else {
    [x1, y1, x2, y2] = svgPathBbox(path);
  }
  // find radius of circle that would fit the bounding box
  // centered on cx, cy and touching furthest corner using pythagoras
  const dx = Math.max(Math.abs(cx - x1), Math.abs(cx - x2));
  const dy = Math.max(Math.abs(cy - y1), Math.abs(cy - y2));
  return Math.sqrt(dx ** 2 + dy ** 2);
};

const TransitionableLine = ({
  x1,
  y1,
  x2,
  y2,
  features,
  translateX = 0,
  translateY = 0,
  rotation = 0,
  cx = 0,
  cy = 0,
  duration = 1000,
  color = "#ff7001",
  backgroundColor = "transparent",
  ...staticAttributes
}) => {
  let featurePaths;
  if (features) {
    let bBoxRadius = getBboxRadius(features, cx, cy);
    featurePaths = (
      <g transform={`translate(${cx}, ${cy})`}>
        <motion.g
          style={{
            fill: backgroundColor,
            fillOpacity: 1,
            stroke: color,
            strokeWidth: 5,
            strokeLinecap: "round",
            strokeLineJoin: "round",
            transformOrigin: "center bottom",
          }}
          initial={{
            x: 0,
            y: 0,
            transformOrigin: "center bottom",
            rotate: 0,
          }}
          animate={{
            x: translateX,
            y: translateY,
            transformOrigin: "center bottom",
            rotate: rotation,
            transition: {
              default: { type: "spring", duration: duration / 1000 },
            },
          }}
        >
          {Array.isArray(features) ? (
            features.map((feature, j) => <path key={j} d={feature} />)
          ) : (
            <g transform={`translate(${-cx}, ${-cy})`}>
              <path d={features} />
              <circle
                cx={cx}
                cy={cy}
                r={bBoxRadius}
                fill="none"
                stroke="none"
              />
            </g>
          )}
        </motion.g>
      </g>
    );
  }

  return <g>{featurePaths}</g>;
};

const calculateFlatPoints = (curvedPoints, compression = 1) => {
  const flatPoints = [];
  const width = 256;
  const y = 96;
  const totalDistance =
    curvedPoints.reduce((acc, point, index) => {
      if (index === 0) {
        return acc;
      }
      const [x1, y1] = curvedPoints[index - 1];
      const [x2, y2] = point;
      return acc + Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }, 0) * compression;

  const segmentLength = totalDistance / (curvedPoints.length - 1);
  let x = (width - totalDistance) / 2;

  for (let i = 0; i < curvedPoints.length; i++) {
    flatPoints.push([x, y]);
    x += segmentLength;
  }

  return flatPoints;
};

let octagon = [];
let paths = [];
let centers = [];
const centerX = 128;
const centerY = 128;
const radius = 64;
const innerRadius = 0.4 * radius;
const outerRadius = 0.95 * radius;
const numSides = 9;
const extension = (Math.PI * 1.1) / numSides;
const endAdjustment = [0.5, 1.25];
const compression = 0.6;

const getAngle = (i) =>
  (i * 2 * Math.PI) / (numSides + 1) +
  (Math.PI * (numSides / 2 + 2)) / numSides;

for (let i = 0; i < numSides; i++) {
  const angle = getAngle(i);
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);

  // calculate the center point of the octagon side
  const endAngle = getAngle(i + 1);

  const endX = centerX + radius * Math.cos(endAngle);
  const endY = centerY + radius * Math.sin(endAngle);
  const centerPointX = (x + endX) / 2;
  const centerPointY = (y + endY) / 2;
  centers.push([centerPointX, centerPointY]);

  // also draw a trapezoid path for each side of the octagon with the
  // outer edge of the trapezoid 0.2 * radius outside the octagon side
  // and the inner edge 0.2 * radius inside the octagon side
  const outerAdjustment1 = i == 0 ? endAdjustment[0] : 1;
  const innerAdjustment1 = i == 0 ? endAdjustment[1] : 1;
  const outerAdjustment2 = i == numSides - 2 ? endAdjustment[0] : 1;
  const innerAdjustment2 = i == numSides - 2 ? endAdjustment[1] : 1;

  const angle1 = getAngle(i);
  const x1 = centerX + outerRadius * outerAdjustment1 * Math.cos(angle1);
  const y1 = centerY + outerRadius * outerAdjustment1 * Math.sin(angle1);

  const angle2 = getAngle(i + 1);
  const x2 = centerX + outerRadius * outerAdjustment2 * Math.cos(angle2);
  const y2 = centerY + outerRadius * outerAdjustment2 * Math.sin(angle2);

  const angle3 = getAngle(i + 1) + extension;
  const x3 = centerX + innerRadius * innerAdjustment2 * Math.cos(angle3);
  const y3 = centerY + innerRadius * innerAdjustment2 * Math.sin(angle3);

  const angle4 = getAngle(i) - extension;
  const x4 = centerX + innerRadius * innerAdjustment1 * Math.cos(angle4);
  const y4 = centerY + innerRadius * innerAdjustment1 * Math.sin(angle4);
  const controlPointOffset1 = 1.1 * outerRadius;
  const controlPointAngle1 = angle1 + extension;
  const controlPointX1 =
    centerX + controlPointOffset1 * Math.cos(controlPointAngle1);
  const controlPointY1 =
    centerY + controlPointOffset1 * Math.sin(controlPointAngle1);

  const controlPointOffset2 = 0.75 * innerRadius;
  const controlPointAngle2 = angle2 - extension;
  const controlPointX2 =
    centerX + controlPointOffset2 * Math.cos(controlPointAngle2);
  const controlPointY2 =
    centerY + controlPointOffset2 * Math.sin(controlPointAngle2);

  const legs = i < numSides - 2 ? `M ${x3},${y3} L ${centerX},${centerY}` : "";
  paths.push(
    `M ${x1},${y1} Q ${controlPointX1},${controlPointY1} ${x2},${y2} L ${x3},${y3} Q ${controlPointX2},${controlPointY2} ${x4},${y4} Z ${legs}`,
  );
  octagon.push([x, y]);
}

const calculateWalkingPoints = (
  points,
  compression = 1,
  offset = 10,
  startIndex = 0,
) => {
  // keep total path length constant but increase y coordinate of
  // every other point from startIndex point by offset
  // assume input path is flat and straight
  let walkingPoints = [];
  const totalDistance =
    points.reduce((acc, point, index) => {
      if (index === 0) {
        return acc;
      }
      const [x1, y1] = points[index - 1];
      const [x2, y2] = point;
      return acc + Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }, 0) * compression;

  const segmentLength = totalDistance / (points.length - 1);
  let xShift = 0;
  for (let i = 0; i < points.length; i++) {
    let [x, y] = points[i];
    let newX = x;
    let newY = y;
    if (i % 2 == startIndex) {
      newY += offset;
    }
    let xShift =
      Math.sqrt(segmentLength ** 2 - (newY - y) ** 2) - segmentLength;
    newX += xShift;
    walkingPoints.push([newX, newY]);
  }

  return walkingPoints;
};

const CURVED = octagon;
const FLAT = calculateFlatPoints(CURVED, compression);

const POINTS = {
  curved: CURVED,
  flat: FLAT,
  walk1: calculateWalkingPoints(FLAT, compression, 1.5, 1),
  walk2: calculateWalkingPoints(FLAT, compression, 1.5, 0),

  features: paths,
  centers,
};

const shapes = [
  "curved",
  "flat",
  "walk1",
  "walk2",
  "walk1",
  "walk2",
  "walk1",
  "walk2",
  "walk1",
  "walk2",
  "walk1",
  "walk2",
  "walk1",
  "walk2",
  "walk1",
  "walk2",
  "walk1",
  "walk2",
  "flat",
];

const Logo = ({
  lineColor,
  theme = "lightTheme",
  colorScheme,
  backgroundColor = "transparent",
  strokeColor = lineColor,
  fillOpacity = 1,
  invert,
  animate = false,
  delay = 0,
  duration: totalDuration = 8,
}) => {
  if (!lineColor) {
    lineColor = invert
      ? colorScheme[theme].darkColor
      : colorScheme[theme].lightColor;
  }
  if (backgroundColor === "contrast") {
    backgroundColor = invert
      ? colorScheme[theme].lightColor
      : colorScheme[theme].darkColor;
  }

  const [index, setIndex] = useState(0);
  const [shape, setShape] = useState(shapes[index]);
  const defaultColors = shapes.map((_) => backgroundColor);
  const [coloring, setColoring] = useState(defaultColors);
  const [isopod, setIsopod] = useState(null);
  const [mouseDown, setMouseDown] = useState(false);
  const [animateInterval, setAnimateInterval] = useState(null);
  let duration = (totalDuration / shapes.length) * (index == 0 ? 1000 : 500);

  const drawMovingLines = () => {
    let movingLines = [];
    for (let i = 0; i < POINTS[shape].length - 1; i++) {
      const centerX = (POINTS.curved[i][0] + POINTS.curved[i + 1][0]) / 2;
      const centerY = (POINTS.curved[i][1] + POINTS.curved[i + 1][1]) / 2;
      const translateX =
        (POINTS[shape][i][0] + POINTS[shape][i + 1][0]) / 2 - centerX;
      const translateY =
        (POINTS[shape][i][1] + POINTS[shape][i + 1][1]) / 2 - centerY;

      const angleCurved = Math.atan2(
        POINTS.curved[i + 1][1] - POINTS.curved[i][1],
        POINTS.curved[i + 1][0] - POINTS.curved[i][0],
      );
      const angleFlat = Math.atan2(
        POINTS[shape][i + 1][1] - POINTS[shape][i][1],
        POINTS[shape][i + 1][0] - POINTS[shape][i][0],
      );
      let rotation = (angleFlat - angleCurved) * (180 / Math.PI);
      movingLines.push(
        <TransitionableLine
          key={i}
          style={{
            fill: "none",
            stroke: "red",
            strokeWidth: 5.8,
            strokeLinecap: "round",
          }}
          x1={POINTS[shape][i][0]}
          y1={POINTS[shape][i][1]}
          x2={POINTS[shape][i + 1][0]}
          y2={POINTS[shape][i + 1][1]}
          features={(POINTS.features && POINTS.features[i]) || null}
          translateX={translateX}
          translateY={translateY}
          rotation={rotation}
          cx={POINTS.centers[i][0]}
          cy={POINTS.centers[i][1]}
          duration={duration}
          color={strokeColor}
          backgroundColor={strokeColor == lineColor ? coloring[i] : lineColor}
        />,
      );
    }
    return movingLines;
  };

  const drawIsopod = () => {
    let movingLines = drawMovingLines();
    return (
      <motion.g
        initial={{
          x: 0,
          scale: 1.25,
        }}
        animate={{
          x:
            index > 1 || index == shapes.length - 1
              ? ((index - 1) * 256) / (shapes.length - 2)
              : 0,
          scale: index == 0 ? 1.25 : 1,
          transition: {
            default: {
              type: "linear",
              duration: index <= 1 ? 0 : duration / 2000,
            },
          },
        }}
      >
        {movingLines}
      </motion.g>
    );
  };

  useEffect(() => {
    setIsopod(drawIsopod());
  }, [index, coloring]);

  useEffect(() => {
    let interval;
    if (animate) {
      interval = setInterval(() => {
        setIndex((index + 1) % shapes.length);
        setShape(shapes[(index + 1) % shapes.length]);
      }, duration);
    }

    return () => {
      clearInterval(interval);
    };
  }, [shape, coloring]);

  const x = 0;
  const y = 0;
  const width = 256;
  const height = 256;

  // Define the background rectangle
  const bgRect =
    backgroundColor === "transparent" ? null : (
      <rect x={x} y={y} width={width} height={height} fill={backgroundColor} />
    );

  return (
    <svg height="100%" viewBox="0 0 256 256" preserveAspectRatio="xMinYMin">
      <g>
        {bgRect}
        <g id="isopod1">{isopod}</g>
        {index > 2 && (
          <g id="isopod2" transform="translate(-256, 0)">
            {isopod}
            <rect x="0" y="0" width="256" height="256" fill="black" />
          </g>
        )}
      </g>
    </svg>
  );
};

export default compose(withTheme, withColors)(Logo);
