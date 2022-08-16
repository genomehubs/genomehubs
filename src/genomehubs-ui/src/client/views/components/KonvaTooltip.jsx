import { Group, Label, Rect, Tag, Text } from "react-konva";
import {
  ancestralColor,
  descendantColor,
  directColor,
} from "../reducers/color";

import React from "react";
import { format } from "d3-format";

const colors = {
  direct: { color: directColor, size: 3 },
  descendant: { color: descendantColor, size: 2 },
  ancestor: { color: ancestralColor },
};

const sci = (v) => {
  if (v < 10) {
    return format(".2r")(v);
  }
  if (v < 1000) {
    return format(".3r")(v);
  }
  return format(".3s")(v);
};
const sciInt = (v) => {
  if (v < 1000) {
    return Math.ceil(v);
  }
  return format(".3s")(v);
};

const KonvaTooltip = ({ e, segment, field, scale, statusColors }) => {
  if (!segment) {
    return null;
  }

  const stage = e.target.getStage();
  const offset = { x: stage.x(), y: stage.y() };
  let x = e.evt.layerX - offset.x;
  let y = e.evt.layerY - offset.y;

  x /= scale;
  y /= scale;
  y = Math.max(y, 40);
  let yPos = y;
  let direction = "down";
  let text;
  let detail;
  if (field) {
    if (segment.fields && segment.fields[field]) {
      let value = sci(segment.fields[field].value);
      let min = sci(segment.fields[field].min);
      let max = sci(segment.fields[field].max);
      if (max != min) {
        value = `${value} [${min}-${max}]`;
      }

      text = (
        <Text
          text={field}
          fontSize={12}
          padding={value.length > field.length * 1.9 ? 12 : 10}
          offsetY={7}
          fill="#dddddd"
        />
      );
      detail = (
        <Text
          x={x - 60}
          y={yPos - 24}
          width={120}
          text={value}
          fontSize={value.length > field.length * 1.9 ? 9 : 10}
          align={"center"}
          fill={"white"}
        />
      );
    }
  } else {
    text = (
      <Text
        text={segment.scientific_name}
        fontSize={12}
        padding={segment.source ? 10 : 5}
        offsetY={segment.source ? 5 : 0}
        fill="white"
      />
    );
    if (segment.source) {
      detail = (
        <Group x={x - 15} y={yPos - 18 - (segment.status ? 2 : 0)}>
          <Rect height={segment.status ? 5 : 2} width={30} fill={"white"} />
          <Rect
            height={segment.status ? 5 : 2}
            width={colors[segment.source].size * 10}
            fill={colors[segment.source].color}
          />
        </Group>
      );
    }
  }

  return (
    // <Label x={e.target.attrs.x + e.target.attrs.width / 2} y={e.target.attrs.y}>
    <Group>
      <Label x={x} y={y}>
        <Tag
          fill={"31323f"}
          pointerDirection={direction}
          pointerWidth={10}
          pointerHeight={10}
          lineJoin="round"
          shadowColor="black"
        />
        {text}
      </Label>
      {detail}
    </Group>
  );
};

export default KonvaTooltip;
