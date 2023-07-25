import { Rectangle, Text } from "recharts";

import React from "react";
import Tooltip from "./Tooltip";
import formats from "../functions/formats";
import stringLength from "../functions/stringLength";
import styles from "./Styles.scss";

export const processLegendData = ({
  bounds,
  yBounds,
  minWidth = 40,
  labelPadding = 70,
  width,
  pointSize,
  compactLegend,
}) => {
  let translations = {};
  let catTranslations = {};
  let catOffsets = {};
  let legendRows = 1;
  let yTranslations = {};

  if (bounds?.stats?.cats) {
    for (let cat of bounds.stats.cats) {
      translations[cat.key] = cat.label;
    }
  }
  if (yBounds?.stats?.cats) {
    for (let cat of yBounds.stats.cats) {
      yTranslations[cat.key] = cat.label;
    }
  }
  if (bounds?.cats) {
    let catOffset = 0;
    let len = bounds.cats.length;
    let row = 1;
    let previousCats = [];
    for (let i = 0; i < len; i++) {
      let cat = bounds.cats[i];
      let labelWidth = Math.max(
        stringLength(cat.label) * pointSize + 1 * pointSize,
        minWidth
      );
      if (labelWidth + catOffset < width - labelPadding) {
        catOffsets[cat.label] = { offset: 0, row };
        for (let prevCat of previousCats) {
          catOffsets[prevCat].offset += labelWidth;
        }
        previousCats.push(cat.label);
        catOffset += labelWidth;
      } else {
        if (catOffset > 0) {
          row++;
        }
        catOffsets[cat.label] = { offset: 0, row };
        if (labelWidth > width - labelPadding) {
          catOffset = 0;
          row++;
        } else {
          catOffset = labelWidth;
        }
        previousCats = [cat.label];
      }
    }
    for (let cat of bounds.cats) {
      catTranslations[cat.key] = cat.label;
    }
    legendRows = row;
  }
  return {
    translations,
    catTranslations,
    catOffsets,
    legendRows,
    yTranslations,
  };
};

export const valueString = ({ stats, cellSize, pointSize, fill }) => {
  let value, string;
  if (stats) {
    if (stats.sum) {
      string = `n=${formats(stats.sum, "integer")}${
        stats.sum > 0 && stats.max > stats.min
          ? ` [${formats(stats.min, "integer")}-${formats(
              stats.max,
              "integer"
            )}]`
          : ""
      }`;
      value = (
        <Text
          x={-5}
          y={cellSize * 1.15}
          fill={"rgb(102, 102, 102)"}
          dominantBaseline={"alphabetic"}
          textAnchor={"end"}
          fontSize={pointSize}
        >
          {string}
        </Text>
      );
    } else if (stats.count) {
      let num = formats(stats.count, "integer");
      let denom = formats(stats.total, "integer");
      string = num;
      if (denom) {
        string += ` / ${denom}`;
      }
      value = (
        <text
          x={-5}
          y={cellSize}
          fill={"rgb(102, 102, 102)"}
          dominantBaseline={"alphabetic"}
          textAnchor={"end"}
          fontSize={pointSize}
        >
          {/* <tspan>{"n="}</tspan> */}
          <tspan fill={fill}>{num}</tspan>
          {stats.total && <tspan>{` / ${denom}`}</tspan>}
        </text>
      );
    }
  }
  return { value, string };
};

const MultiCatLegend = ({
  width,
  x,
  fill,
  i,
  n = 1,
  name,
  stats,
  legendWidth,
  offset,
  row,
  pointSize,
  compactLegend,
  handleClick,
  active,
}) => {
  if (!legendWidth) {
    legendWidth = pointSize * 10;
  }
  let cellSize = pointSize * 1 + 5;
  let xPos;
  let j = 1;
  if (offset || offset === 0) {
    xPos = x + width - offset;
    j = row;
  } else {
    row = Math.floor((width - 50) / legendWidth);
    if (i > row) {
      while (j * (row + 1) < i + 1) {
        j++;
      }
      i %= row + 1;
    } else {
      // i += 1;
    }
    if (row >= n) {
      row = n - 1;
    } else if (j > 1 && j * (row + 1) > n) {
      i += j * (row + 1) - n;
    }
    xPos = x + width - legendWidth * (row - i);
  }

  let value;
  if (!compactLegend) {
    ({ value } = valueString({ stats, cellSize, pointSize, fill }));
  }
  let strokeWidth = pointSize / 5;
  let bgRect;
  if (handleClick) {
    let bgWidth = compactLegend
      ? stringLength(name) * pointSize * 0.9 + cellSize
      : legendWidth - cellSize / 2 + strokeWidth * 2;
    bgRect = (
      <Tooltip title={`Click to highlight ${name}`} arrow>
        <Rectangle
          className={styles.active}
          height={cellSize * (compactLegend ? 1 : 2) + strokeWidth * 2}
          width={bgWidth}
          fill={"white"}
          stroke={fill || "rgb(102, 102, 102)"}
          strokeOpacity={active ? 0.5 : 0}
          strokeWidth={pointSize / 10}
          x={cellSize - bgWidth - strokeWidth} // {props.cx + (w - width) / 2}
          y={-cellSize / 2 - strokeWidth}
        />
      </Tooltip>
    );
  }
  let text = (
    <g
      key={`cell-${i}`}
      transform={`translate(${-cellSize / 2},${
        cellSize / 2 + (j - 1) * ((compactLegend ? 1 : 2) * cellSize + 5)
      })`}
    >
      {bgRect}
      <g pointerEvents={handleClick ? "none" : "auto"}>
        <Text
          x={-5}
          y={cellSize / 4}
          fill={fill || "rgb(102, 102, 102)"}
          dominantBaseline={"alphabetic"}
          textAnchor={"end"}
          fontWeight={"bold"}
          fontSize={pointSize}
        >
          {name}
        </Text>
        {value}
        <Rectangle
          key={`cell-${i}`}
          height={cellSize * (compactLegend ? 1 : 2)}
          width={cellSize / 2}
          fill={fill || "rgb(102, 102, 102)"}
          x={0} // {props.cx + (w - width) / 2}
          y={-cellSize / 2}
          // style={{ pointerEvents: "none" }}
        />
      </g>
    </g>
  );

  return (
    <g
      transform={`translate(${xPos}, 5)`}
      style={{ cursor: handleClick ? "pointer" : "default" }}
      onClick={handleClick ? () => handleClick(i) : () => {}}
    >
      {text}
    </g>
  );
};

export default MultiCatLegend;
