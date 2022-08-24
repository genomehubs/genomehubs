import {
  Cell,
  Label,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import MultiCatLegend, {
  processLegendData,
  valueString,
} from "./MultiCatLegend";
import React, { useRef } from "react";

import Grid from "@material-ui/core/Grid";
import { compose } from "recompose";
import { format } from "d3-format";
import stringLength from "../functions/stringLength";
import useResize from "../hooks/useResize";
import withColors from "../hocs/withColors";

const pct = format(".0%");
const pct1 = format(".1%");

const PieComponent = ({ data, height, width, colors }) => {
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={"middle"}
        dominantBaseline="central"
        fontSize={innerRadius / 4}
      >
        {`${pct(percent)}`}
      </text>
    );
  };

  const CustomLabel = ({ viewBox, value1, value2, value3 }) => {
    const { cx, cy, innerRadius } = viewBox;
    return (
      <g>
        <text
          x={cx}
          y={cy + innerRadius / 20 - 5}
          fill={"#3d405c"}
          className="recharts-text recharts-label"
          textAnchor="middle"
          alignmentBaseline="central"
          fontSize={innerRadius / 2.5}
        >
          {value1}
        </text>
        <text
          x={cx}
          y={cy + innerRadius / 5}
          fill="#3d405c"
          className="recharts-text recharts-label"
          textAnchor="middle"
          alignmentBaseline="hanging"
          fontSize={innerRadius / 4.5}
        >
          <tspan alignmentBaseline="hanging" fill={colors[0]}>
            {value2.toLocaleString()}
          </tspan>
          <tspan alignmentBaseline="hanging">
            {" "}
            / {value3.toLocaleString()}
          </tspan>
        </text>
      </g>
    );
  };

  const xValue = data[0].value;
  const yValue = data[1].value;
  const ratio = pct1(xValue / (xValue + yValue));

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
            />
          }
        ></Label>
      </Pie>
    </PieChart>
  );
};

const RadialBarComponent = ({ data, height, width, pointSize }) => {
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
        <g
          fill={fill}
          style={{ fontSize, fontFamily: "sans-serif" }}
          transform="translate(0,2)"
        >
          <text
            x={cx}
            y={cy - viewBox.innerRadius - fontSize + 2}
            textAnchor="middle"
            dominantBaseline="middle"
            alignmentBaseline="central"
          >
            {pct1(value)}
          </text>
        </g>
        <g transform={`translate(0,${cy + fontSize})`}>
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
    if (strLen > nameLen) {
      bounds.cats.unshift({ key: name, label: string });
    } else {
      bounds.cats.unshift({ key: name, label: name });
    }
  }
  const { catOffsets, catTranslations, legendRows } = processLegendData({
    bounds,
    width,
    pointSize,
  });
  let innerRadius = Math.floor(width * 0.1);
  let outerRadius = Math.floor(width * 0.5);
  let background = "#cccccc";
  return (
    <RadialBarChart
      width={width}
      height={height}
      cx="50%"
      cy="60%"
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

const ReportXInY = ({
  xInY,
  chartRef,
  containerRef,
  colors,
  levels,
  minDim,
  pointSize = 15,
}) => {
  const componentRef = chartRef ? chartRef : useRef();
  const { width, height } = containerRef
    ? useResize(containerRef)
    : useResize(componentRef);

  if (xInY && xInY.status) {
    let chartData = [];
    let chart;
    if (Array.isArray(xInY.report.xInY)) {
      xInY.report.xInY.forEach((report, i) => {
        if (levels[xInY.report.xInY.length]) {
          colors = levels[xInY.report.xInY.length];
        }
        let { xiny, x, y, rank } = report;
        chartData.push({
          xValue: x,
          xPortion: xiny,
          yValue: y,
          index: i,
          name: rank,
          fill: colors[i % colors.length],
        });
      });
      chartData = chartData.reverse();
      // TODO: set legend item widths dynamically
      chart = (
        <RadialBarComponent
          data={chartData}
          width={minDim}
          height={minDim - 50}
          pointSize={pointSize}
        />
      );
    } else {
      let { x, y, xTerm, yTerm } = xInY.report.xInY;
      chartData = [
        { value: x, name: xTerm },
        { value: y - x, name: yTerm },
      ];
      if (levels[2]) {
        colors = levels[2];
      }
      chart = (
        <PieComponent
          data={chartData}
          width={minDim - 50}
          height={minDim - 50}
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

export default compose(withColors)(ReportXInY);
