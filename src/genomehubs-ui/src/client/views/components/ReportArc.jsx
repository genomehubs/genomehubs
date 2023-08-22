import {
  Cell,
  Label,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  Tooltip,
} from "recharts";
import MultiCatLegend, {
  processLegendData,
  valueString,
} from "./MultiCatLegend";
import React, { useEffect, useRef, useState } from "react";

import Grid from "@material-ui/core/Grid";
import MuiTooltip from "./Tooltip";
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

const CustomTooltip = ({ active, payload, label }) => {
  return null;
  if (active && payload && payload.length) {
    return (
      <div style={{ overflow: "visible", padding: "3em", background: "red" }}>
        <MuiTooltip title={"testing"} arrow placement={"top"}>
          <div className="custom-tooltip" style={{ border: "solid blue" }}>
            test
          </div>
        </MuiTooltip>
      </div>
    );
  }

  return null;
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
        <MuiTooltip
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
        </MuiTooltip>
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
      <Tooltip content={<CustomTooltip />} />

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
        let { arc: currentArc, x, y, rank, xQuery } = report;
        chartData.push({
          xValue: x,
          xPortion: currentArc,
          yValue: y,
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
