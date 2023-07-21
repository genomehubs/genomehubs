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
import setColors from "../functions/setColors";
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
        dominantBaseline="alphabetic"
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
          <tspan
            alignmentBaseline="hanging"
            dominantBaseline="alphabetic"
            fill={colors[0]}
          >
            {value2.toLocaleString()}
          </tspan>
          <tspan alignmentBaseline="hanging" dominantBaseline="alphabetic">
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

const RadialBarComponent = ({
  data,
  height,
  width,
  pointSize,
  compactLegend,
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

  let plotWidth = Math.min(width, 2 * plotHeight);
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
  colorPalette,
  palettes,
  minDim,
  embedded,
  pointSize,
}) => {
  const componentRef = chartRef ? chartRef : useRef();
  const { width, height } = containerRef
    ? useResize(containerRef)
    : useResize(componentRef);
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
        let { arc: currentArc, x, y, rank } = report;
        chartData.push({
          xValue: x,
          xPortion: currentArc,
          yValue: y,
          index: i,
          name: rank,
          fill: colors[i % colors.length],
        });
      });
      chartData = chartData.reverse();
      // TODO: set legend item widths dynamically
      let compactLegend = typeof embedded === "undefined";
      chart = (
        <RadialBarComponent
          data={chartData}
          width={compactLegend ? minDim : width}
          height={minDim - 50}
          pointSize={pointSize}
          compactLegend={compactLegend}
        />
      );
    } else {
      let { x, y, xTerm, yTerm } = arc.report.arc;
      chartData = [
        { value: x, name: xTerm },
        { value: y - x, name: yTerm },
      ];
      ({ levels, colors } = setColors({
        colorPalette,
        palettes,
        levels,
        count: 2,
        colors,
      }));
      chart = (
        <PieComponent
          data={chartData}
          width={minDim}
          height={minDim}
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

export default compose(withColors)(ReportArc);
