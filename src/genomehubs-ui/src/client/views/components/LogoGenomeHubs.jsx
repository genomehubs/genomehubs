import { compose } from "redux";
import { motion } from "motion/react";
import withColors from "#hocs/withColors";
import withTheme from "#hocs/withTheme";

const Logo = ({
  lineColor,
  theme = "lightTheme",
  colorScheme,
  backgroundColor = "transparent",
  fillOpacity = 0,
  invert,
  animate = false,
  delay = 0,
  duration = 8,
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
  const x = 43.845234;
  const y = 65.678574;
  const width = 135.46666;
  const height = 135.46666;
  let bgRect =
    backgroundColor === "transparent" ? null : (
      <rect x={x} y={y} width={width} height={height} fill={backgroundColor} />
    );

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${x} ${y} ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", overflow: "hidden" }}
    >
      <defs>
        <clipPath id="ghBgClip">
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
        {/* <clipPath
       clipPathUnits="userSpaceOnUse"
       id="clipPath1427">
      <rect
         style="opacity:1;fill:none;stroke-width:1"
         id="rect1429"
         width="47.772686"
         height="29.700172"
         x="131.53922"
         y="95.536835" />
    </clipPath> */}
      </defs>
      <g clipPath="url(#ghBgClip)">
        {bgRect}
        <path
          style={{ fill: "none", stroke: lineColor, strokeWidth: 6.9704 }}
          d="M 110.64018,202.51165 V 159.10356"
          transform="matrix(1,0,0,0.92058086,1.6767298,16.083301)"
        />
        <motion.path
          style={{ fill: "none", stroke: lineColor, strokeWidth: 6.9704 }}
          initial={{ pathOffset: 0, pathLength: 1 }}
          animate={
            animate && {
              pathOffset: [0, 1, 0, 0, 0],
              pathLength: [1, 0, 0, 1, 1],
              transition: {
                duration: duration / 2,
                delay,
                repeat: Infinity,
                repeatDelay: duration / 4,
              },
            }
          }
          d="M 38.580337,101.47897 118.18676,62.030086"
        />
        <path
          style={{ fill: "none", stroke: lineColor, strokeWidth: 6.9704 }}
          d="M 132.94374,122.33348 182.33677,98.440355"
          transform="matrix(0.92545586,0,0,0.92545586,13.366643,7.121702)"
        />
        <circle
          style={{ fill: "none", stroke: lineColor, strokeWidth: 6.9704 }}
          cx="112.31691"
          cy="133.4119"
          r="29.139097"
        />
      </g>
    </svg>
  );
};

export default compose(withTheme, withColors)(Logo);
