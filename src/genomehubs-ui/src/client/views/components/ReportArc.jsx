import {
  Cell,
  Label,
  Line,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  Rectangle,
} from "recharts";
import MultiCatLegend, {
  processLegendData,
  valueString,
} from "./MultiCatLegend";
import React, { useEffect, useRef, useState } from "react";

import Grid from "@material-ui/core/Grid";
import Tooltip from "./Tooltip";
import { compose } from "recompose";
import { format } from "d3-format";
import qs from "../functions/qs";
import setColors from "../functions/setColors";
import { setMessage } from "../reducers/message";
import stringLength from "../functions/stringLength";
import styles from "./Styles.scss";
import { useNavigate } from "@reach/router";
import useResize from "../hooks/useResize";
import withColors from "../hocs/withColors";
import withSiteName from "../hocs/withSiteName";

const pct = format(".0%");
const pct1 = format(".1%");

const arc = (
  startX,
  startY,
  ir,
  or,
  endX,
  endY,
  istartX,
  istartY,
  iendX,
  iendY,
  flag
) => {
  return (
    "M" +
    startX +
    " " +
    startY +
    "A" +
    or +
    " " +
    or +
    ` 0 ${!flag ? 1 : 0} 1 ` +
    endX +
    " " +
    endY + // outer
    "L" +
    istartX +
    " " +
    istartY +
    "A" +
    ir +
    " " +
    ir +
    ` 0 ${!flag ? 1 : 0} 0 ` +
    iendX +
    " " +
    iendY // inner
  );
};

const PieComponent = ({ data, height, width, colors }) => {
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    startAngle,
    endAngle,
    query,
  }) => {
    if (percent < 0.05) {
      return null;
    }
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent == 1) {
      startAngle -= 0.01;
      endAngle += 0.01;
    }
    const { startX, startY, endX, endY, istartX, istartY, iendX, iendY } =
      setupArc({
        cx,
        cy,
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
      });
    // const startX = cx + outerRadius * Math.cos(-startAngle * RADIAN);
    // const startY = cy + outerRadius * Math.sin(-startAngle * RADIAN);
    // const endX = cx + outerRadius * Math.cos(-endAngle * RADIAN);
    // const endY = cy + outerRadius * Math.sin(-endAngle * RADIAN);
    // const istartX = cx + innerRadius * Math.cos(-endAngle * RADIAN);
    // const istartY = cy + innerRadius * Math.sin(-endAngle * RADIAN);
    // const iendX = cx + innerRadius * Math.cos(-startAngle * RADIAN);
    // const iendY = cy + innerRadius * Math.sin(-startAngle * RADIAN);

    return (
      <g>
        <Tooltip title={"Click to search"} arrow>
          <path
            d={arc(
              startX,
              startY,
              innerRadius,
              outerRadius,
              endX,
              endY,
              istartX,
              istartY,
              iendX,
              iendY,
              percent < 0.5
            )}
            fillOpacity={0}
            cursor={"pointer"}
            onClick={() =>
              data.navigate(`${data.basename}/search?${qs.stringify(query)}`)
            }
          />
        </Tooltip>

        <text
          x={x}
          y={y}
          fill="white"
          textAnchor={"middle"}
          dominantBaseline="alphabetic"
          fontSize={innerRadius / 4}
        >
          {`${pct(percent)}`}
        </text>
      </g>
    );
  };

  const setupArc = ({
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
  }) => {
    console.log({ cx, cy, startAngle, endAngle, innerRadius, outerRadius });
    const RADIAN = Math.PI / 180;
    const startX = cx + outerRadius * Math.cos(-startAngle * RADIAN);
    const startY = cy + outerRadius * Math.sin(-startAngle * RADIAN);
    const endX = cx + outerRadius * Math.cos(-endAngle * RADIAN);
    const endY = cy + outerRadius * Math.sin(-endAngle * RADIAN);
    const istartX = cx + innerRadius * Math.cos(-endAngle * RADIAN);
    const istartY = cy + innerRadius * Math.sin(-endAngle * RADIAN);
    const iendX = cx + innerRadius * Math.cos(-startAngle * RADIAN);
    const iendY = cy + innerRadius * Math.sin(-startAngle * RADIAN);
    return {
      startX,
      startY,
      endX,
      endY,
      istartX,
      istartY,
      iendX,
      iendY,
    };
  };

  const CustomLabel = ({ viewBox, value1, value2, value3, value4 }) => {
    const { cx, cy, innerRadius, outerRadius } = viewBox;

    const { startX, startY, endX, endY, istartX, istartY, iendX, iendY } =
      setupArc({
        cx,
        cy,
        innerRadius: innerRadius * 0.92,
        outerRadius: innerRadius * 0.96,
        startAngle: 90,
        endAngle: 90 - (value4 ? value3 / value4 : value2 / value3) * 360,
      });

    return (
      <g>
        <text
          x={cx}
          y={cy - 5}
          fill={"#3d405c"}
          className="recharts-text recharts-label"
          textAnchor="middle"
          alignmentBaseline="central"
          dominantBaseline="alphabetic"
          fontSize={innerRadius / 2.5}
        >
          {value1}
        </text>
        {/* {value4 && (
          <>
            <Rectangle
              height={innerRadius / 10}
              width={innerRadius}
              fill={colors[1]}
              stroke={"none"}
              x={cx - innerRadius / 2} // {props.cx + (w - width) / 2}
              y={cy + innerRadius / 6}
            />
            <Rectangle
              height={innerRadius / 10}
              width={(innerRadius * value2) / value3}
              fill={colors[0]}
              stroke={"none"}
              x={cx - innerRadius / 2} // {props.cx + (w - width) / 2}
              y={cy + innerRadius / 6}
            />
          </>
        )} */}

        <text
          x={cx}
          y={cy + innerRadius / 5}
          fill="#3d405c"
          className="recharts-text recharts-label"
          textAnchor="middle"
          alignmentBaseline="hanging"
          dominantBaseline="alphabetic"
          fontSize={innerRadius / 4.5}
        >
          <tspan alignmentBaseline="hanging" dominantBaseline="alphabetic">
            {value4 ? value3.toLocaleString() : value2.toLocaleString()}
          </tspan>
          <tspan alignmentBaseline="hanging" dominantBaseline="alphabetic">
            {" "}
            / {value4 ? value4.toLocaleString() : value3.toLocaleString()}
          </tspan>
        </text>

        {value4 && (
          <path
            d={arc(
              startX,
              startY,
              innerRadius * 0.92,
              innerRadius * 0.96,
              endX,
              endY,
              istartX,
              istartY,
              iendX,
              iendY,
              endX > startX
            )}
            fill={"#3d405c"}
          />
        )}
        {/* {value4 && (
          <text
            x={cx}
            y={cy - (2 * innerRadius) / 5}
            fill="#3d405c"
            className="recharts-text recharts-label"
            textAnchor="middle"
            alignmentBaseline="hanging"
            dominantBaseline="alphabetic"
            fontSize={innerRadius / 4.5}
          >
            <tspan
              alignmentBaseline="hanging"
              dominantBaseline="alphabetic"
              fill={colors[1]}
            >
              {value3.toLocaleString()}
            </tspan>
            <tspan alignmentBaseline="hanging" dominantBaseline="alphabetic">
              {" "}
              / {value4.toLocaleString()}
            </tspan>
          </text>
        )} */}
      </g>
    );
  };

  const xValue = data[0].value;
  const yValue = data[1].value;
  const zValue = data[2] ? data[2].value : 0;
  console.log(data);
  const ratio = zValue
    ? pct1((xValue + yValue) / (xValue + yValue + zValue))
    : pct1(xValue / (xValue + yValue));

  return (
    <PieChart width={width} height={height} fontFamily={"sans-serif"}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={renderCustomizedLabel}
        innerRadius={Math.floor(width / 4)}
        outerRadius={Math.floor(width / 2)}
        fill="#8884d8"
        dataKey="value"
        startAngle={90}
        endAngle={-270}
        isAnimationActive={false}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
        <Label
          width={30}
          position="center"
          content={
            <CustomLabel
              value1={ratio}
              value2={xValue}
              value3={xValue + yValue}
              value4={xValue + yValue + zValue}
            />
          }
        ></Label>
      </Pie>
    </PieChart>
  );
};

const donut = (x, y, ir, or) => {
  return (
    "M" +
    (x - or) +
    " " +
    y +
    "A" +
    or +
    " " +
    or +
    " 0 1 1 " +
    (x + or) +
    " " +
    y + // outer
    "M" +
    (x + ir) +
    " " +
    y +
    "A" +
    ir +
    " " +
    ir +
    " 0 1 0 " +
    (x - ir) +
    " " +
    y // inner
  );
};

const RadialBarComponent = ({
  data,
  height,
  width,
  pointSize,
  compactLegend,
  compactWidth = 300,
}) => {
  const renderRadialBarLabel = (props) => {
    const {
      cx,
      cy,
      index,
      viewBox,
      fill,
      value,
      data,
      background,
      width,
      n,
      catOffsets,
      catTranslations,
      legendRows,
    } = props;
    const fontSize = (viewBox.outerRadius - viewBox.innerRadius) / 2;
    let offset = 0;
    let row = 1;
    return (
      <g>
        {width >= compactWidth && (
          <g
            fill={fill}
            style={{ fontSize, fontFamily: "sans-serif" }}
            transform="translate(0,2)"
          >
            <text
              x={cx}
              y={cy - viewBox.innerRadius - fontSize + 2}
              textAnchor="middle"
              dominantBaseline="alphabetic"
              alignmentBaseline="middle"
            >
              {pct1(value)}
            </text>
          </g>
        )}
        <Tooltip
          title={`${data.name}: ${data.xValue} / ${data.yValue}`}
          arrow
          placement="top"
        >
          <path
            d={donut(cx, cy, viewBox.innerRadius, viewBox.outerRadius)}
            fillOpacity={0}
            cursor={"pointer"}
            onClick={() =>
              data.navigate(
                `${data.basename}/search?${qs.stringify(data.xQuery)}`
              )
            }
          />
        </Tooltip>
        <g transform={`translate(0,${cy + 5})`}>
          {MultiCatLegend({
            width: width * 0.96,
            x: 0,
            fill: data.fill,
            i: data.index,
            n,
            name: data.name,
            stats: { count: data.xValue, total: data.yValue },
            legendWidth: 100,
            pointSize,
            offset: catOffsets[catTranslations[data.name]].offset,
            row: catOffsets[catTranslations[data.name]].row,
            compactLegend,
          })}
        </g>
      </g>
    );
  };
  let bounds = { cats: [] };
  for (let d of data) {
    let name = d.name;
    let { string } = valueString({
      stats: { count: d.xValue, total: d.yValue },
    });
    let nameLen = stringLength(name);
    let strLen = stringLength(string);
    if (compactLegend || strLen < nameLen) {
      bounds.cats.unshift({ key: name, label: name });
    } else {
      bounds.cats.unshift({ key: name, label: string });
    }
  }
  const { catOffsets, catTranslations, legendRows } = processLegendData({
    bounds,
    width,
    pointSize,
    compactLegend,
  });
  // let plotHeight = height - 5 - legendRows * (2 * pointSize + 15);
  // if (compactLegend) {
  //   plotHeight = height - 5 - legendRows * (pointSize + 10);
  // }
  let legendHeight = legendRows * (2 * pointSize + 15) + 5;
  if (compactLegend) {
    legendHeight = Math.min(legendRows, 2) * (pointSize + 10) + 5;
  }
  let plotHeight = height - legendHeight;

  let plotWidth = width; //Math.min(width, 2 * plotHeight);
  plotHeight = plotWidth / 2 + legendHeight;
  let innerRadius = Math.floor(plotWidth * 0.1);
  let outerRadius = Math.floor(plotWidth * 0.5);
  let background = "#cccccc";
  return (
    <RadialBarChart
      width={width}
      height={plotHeight}
      cx="50%"
      cy={plotWidth / 2}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={180}
      endAngle={0}
      data={data}
      fontFamily={"sans-serif"}
    >
      <PolarAngleAxis type="number" domain={[0, 1]} tick={false} />

      <RadialBar
        minAngle={15}
        label={{
          position: "inside",
          fill: "white",
          content: (props) =>
            renderRadialBarLabel({
              ...props,
              data: data[props.index],
              background,
              width,
              n: data.length,
              catOffsets,
              catTranslations,
              legendRows,
            }),
        }}
        background={{ fill: background }}
        clockWise={false}
        dataKey="xPortion"
        isAnimationActive={false}
      />
    </RadialBarChart>
  );
};

const ReportArc = ({
  arc,
  chartRef,
  containerRef,
  colors,
  levels,
  ratio,
  colorPalette,
  palettes,
  minDim,
  setMinDim,
  embedded,
  inModal,
  pointSize,
  compactWidth,
  showLegend,
  basename,
}) => {
  const componentRef = chartRef ? chartRef : useRef();
  const { width, height } = inModal
    ? containerRef
      ? useResize(containerRef)
      : useResize(componentRef)
    : componentRef
    ? useResize(componentRef)
    : useResize(containerRef);

  // const { width, height } = useResize(componentRef);

  const setDimensions = ({ width, height, timer, ratio = 1 }) => {
    let plotHeight = inModal ? height : height;
    let plotWidth = width;

    if (arc.report && Array.isArray(arc.report.arc)) {
      if (inModal) {
        if (plotHeight < plotWidth / 2) {
          plotWidth = plotHeight * 2;
        } else {
          plotHeight = plotWidth / 2 - 50;
        }
      } else {
        plotHeight = plotWidth / 2 + pointSize * 3;
      }
    } else {
      plotHeight = Math.min(plotWidth, plotHeight);
    }
    let dimensionTimer;
    if (timer && !inModal) {
      dimensionTimer = setTimeout(() => {
        minDim = Math.min(plotWidth, plotHeight);
        setMinDim(minDim);
      }, 50);
    }
    return {
      plotWidth,
      plotHeight,
      dimensionTimer,
    };
  };

  let dimensionTimer;
  let { plotWidth, plotHeight } = setDimensions({ width, height });

  const navigate = useNavigate();

  useEffect(() => {
    ({ plotWidth, plotHeight, dimensionTimer } = setDimensions({
      width,
      height,
      timer: true,
    }));
    return () => {
      clearTimeout(dimensionTimer);
    };
  }, [width]);

  if (arc && arc.status) {
    let chartData = [];
    let chart;
    if (Array.isArray(arc.report.arc)) {
      arc.report.arc.forEach((report, i) => {
        ({ levels, colors } = setColors({
          colorPalette,
          palettes,
          levels,
          count: arc.report.arc.length,
          colors,
        }));
        let {
          arc: currentArc,
          arc2: currentArc2,
          x,
          y,
          z,
          rank,
          xQuery,
          yQuery,
        } = report;
        chartData.push({
          xValue: x,
          xPortion: currentArc,
          yValue: y,
          yProportion: currentArc2,
          zValue: z,
          index: i,
          name: rank,
          fill: colors[i % colors.length],
          xQuery,
          navigate,
          basename,
        });
      });
      chartData = chartData.reverse();
      let compactLegend = typeof embedded === "undefined";
      chart = (
        <RadialBarComponent
          data={chartData}
          width={
            plotHeight - 50 < plotWidth / 2 ? plotHeight * 2 - 100 : plotWidth
          }
          height={plotHeight}
          pointSize={pointSize}
          compactLegend={compactLegend}
          compactWidth={compactWidth}
        />
      );
    } else {
      let { x, y, z, xTerm, yTerm, zTerm, xQuery, yQuery, zQuery } =
        arc.report.arc;
      chartData = [
        { value: x, name: xTerm, query: xQuery },
        { value: y - x, name: yTerm, query: yQuery },
        { value: z - y, name: zTerm, query: zQuery },
      ];
      chartData.navigate = navigate;
      chartData.basename = basename;

      ({ levels, colors } = setColors({
        colorPalette,
        palettes,
        levels,
        count: z ? 3 : 2,
        colors,
      }));
      chart = (
        <PieComponent
          data={chartData}
          // width={minDim}
          // height={minDim}
          width={plotHeight}
          height={plotHeight}
          colors={colors}
        />
      );
    }

    return (
      <Grid item xs ref={componentRef} style={{ height: "100%" }}>
        {chart}
      </Grid>
    );
  } else {
    return null;
  }
};

export default compose(withColors, withSiteName)(ReportArc);
