import stringLength from "#functions/stringLength";
import { useState } from "react";

// Pill geometry in px, all relative to pointSize.
// gap: space between the axis and the pill; thickness: pill size across the margin;
// pad: inset of the pill along the axis; margin: space the axis must reserve.
export const pillGeometry = (pointSize) => {
  const gap = pointSize * 0.3;
  const thickness = pointSize * 1.5;
  return {
    gap,
    thickness,
    fontSize: thickness / 2,
    pad: pointSize * 0.15,
    margin: gap + thickness,
  };
};

// Truncate text from the start with an ellipsis so the end stays visible within maxPx.
export const truncateToWidth = (text, maxPx, fontSize) => {
  let str = `${text ?? ""}`;
  const fits = (s) => stringLength(s) * fontSize <= maxPx;
  if (fits(str)) {
    return str;
  }
  while (str.length > 1 && !fits(`…${str}`)) {
    str = str.slice(1);
  }
  return fits(`…${str}`) ? `…${str}` : "";
};

const PILL_INK = "#31323f";

// Ribbon-style pill; hover expands it from the text start to show truncated text.
export const PillLabel = ({
  x,
  y,
  width,
  height,
  text,
  fontSize,
  vertical = false,
}) => {
  const [hovered, setHovered] = useState(false);
  if (!text) {
    return null;
  }
  const inset = fontSize / 2;
  const length = vertical ? height : width;
  const label = truncateToWidth(text, length - 2 * inset, fontSize);
  const fullLength = stringLength(`${text}`) * fontSize + 2 * inset;
  const expanded = hovered && label !== `${text}`;
  const size = expanded ? Math.max(length, fullLength) : length;
  const rect = vertical
    ? { x, y: expanded ? y + height - size : y, width, height: size }
    : { x, y, width: size, height };
  const radius = Math.min(rect.width, rect.height) / 2;
  const cx = x + width / 2;
  const cy = y + height / 2;
  let anchor = { x: cx, y: cy };
  if (expanded) {
    anchor = vertical
      ? { x: cx, y: y + height - inset }
      : { x: x + inset, y: cy };
  }
  return (
    <g
      onMouseEnter={(event) => {
        // SVG has no z-index; move the Recharts tick wrapper to the end of its siblings.
        const node = event.currentTarget;
        const tick = node.closest(".recharts-cartesian-axis-tick") ?? node;
        tick.parentNode.appendChild(tick);
        setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        rx={radius}
        ry={radius}
        fill={"white"}
        stroke={PILL_INK}
        strokeWidth={2}
      />
      <text
        x={anchor.x}
        y={anchor.y}
        textAnchor={expanded ? "start" : "middle"}
        dominantBaseline={"central"}
        fill={PILL_INK}
        fontSize={fontSize}
        transform={
          vertical ? `rotate(-90, ${anchor.x}, ${anchor.y})` : undefined
        }
      >
        {expanded ? text : label}
      </text>
    </g>
  );
};

export default PillLabel;
