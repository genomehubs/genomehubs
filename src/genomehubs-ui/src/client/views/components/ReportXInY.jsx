// import { RadialChart } from "react-vis";
import {
  Cell,
  Label,
  LabelList,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Sector,
} from "recharts";
import React, { Fragment, useEffect, useRef, useState } from "react";

import Grid from "@material-ui/core/Grid";
import { compose } from "recompose";
import { format } from "d3-format";
import styles from "./Styles.scss";
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
    index,
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
          dominantBaseline="central"
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
    // <ResponsiveContainer width={width} height={height}>
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

      {/* <text x="50%" y="50%" dy={8} textAnchor="middle" fill={"blue"}>
        {pct(data[0].value / data[1].value)}
      </text> */}
    </PieChart>

    // </ResponsiveContainer>
  );
};

const RadialBarComponent = ({ data, height, width, colors }) => {
  const renderRadialBarLabel = (props) => {
    const { cx, cy, index, viewBox, fill, value, data, background } = props;
    const fontSize = (viewBox.outerRadius - viewBox.innerRadius) / 2;
    return (
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
          alignmentBaseline="middle"
        >
          {pct1(value)}
        </text>
        <g
          transform={`translate(0,${cy + (data.index + 1) * fontSize})`}
          fill={background}
          style={{ fontSize: fontSize, fontFamily: "sans-serif" }}
          dominantBaseline="hanging"
          alignmentBaseline="hanging"
        >
          <text x={cx - viewBox.outerRadius} textAnchor="left" fill={data.fill}>
            {data.xValue}
          </text>
          <text x={cx} textAnchor="middle">
            {"/"}
          </text>
          <text x={cx + viewBox.outerRadius} textAnchor="end">
            {data.yValue}
          </text>
        </g>
      </g>
    );
  };
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
            }),
        }}
        background={{ fill: background }}
        clockWise={false}
        dataKey="xPortion"
        isAnimationActive={false}
      />
      <Legend
        iconSize={width / 20}
        height={height / 8}
        verticalAlign="bottom"
        align="right"
      />
    </RadialBarChart>
  );
};

const ReportXInY = ({
  xInY,
  chartRef,
  containerRef,
  ratio,
  colors,
  minDim,
  setMinDim,
}) => {
  const componentRef = chartRef ? chartRef : useRef();
  const { width, height } = containerRef
    ? useResize(containerRef)
    : useResize(componentRef);

  // useEffect(() => {
  //   let newMinDim;
  //   if (height) {
  //     newMinDim = Math.floor(Math.min(width, height));
  //   } else if (width) {
  //     newMinDim = Math.floor(width) / ratio;
  //   }
  //   if (newMinDim) {
  //     setMinDim(newMinDim);
  //   }
  // }, [width, height]);

  if (xInY && xInY.status) {
    let chartData = [];
    let chart;
    if (Array.isArray(xInY.report.xInY)) {
      xInY.report.xInY.forEach((report, i) => {
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
      chart = (
        <RadialBarComponent
          data={chartData}
          width={minDim}
          height={minDim - 50}
          colors={colors}
        />
      );
    } else {
      let { x, y, xTerm, yTerm } = xInY.report.xInY;
      chartData = [
        { value: x, name: xTerm },
        { value: y - x, name: yTerm },
      ];
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
