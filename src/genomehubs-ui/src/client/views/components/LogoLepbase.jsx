import { compose } from "redux";
import { motion } from "motion/react";
import withColors from "#hocs/withColors";
import withTheme from "#hocs/withTheme";

const Logo = ({
  lineColor,
  theme = "lightTheme",
  colorScheme,
  backgroundColor = "transparent",
  fillOpacity = 1,
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

  const transitionProps = {
    repeat: Infinity,
    duration: duration / 2,
    ease: "easeInOut",
    delay,
  };

  const animateProps = {
    rotate: [0, -20, 0],
    translateY: [0, -14, 0],
    translateX: [0, -3, 0],
    // pathOffset: [0, 1, 2],
    // pathLength: [1, 0, 1],
    fillOpacity: [1, 0.5, 1],
    // opacity: [1, 0.5, 1],
    transition: {
      duration: duration,
      ease: "easeInOut",
      repeat: Infinity,
      delay: 0,
    },
  };

  const wingStyle = {
    stroke: lineColor,
    strokeWidth: 6,
    fill: lineColor,
    strokeLinecap: "round",
    strokeOpacity: fillOpacity,
  };
  const wingPath =
    "M 60.354847,141.56789 C 57.637073,127.4262 143.08825,88.267482 155.05831,98.599091 c 11.97005,10.331619 9.62294,54.785179 -3.26626,67.618219 -12.8892,12.83305 -88.719428,-10.50773 -91.437203,-24.64942";

  const wing = (
    <motion.path
      id="wing"
      style={wingStyle}
      animate={animate ? animateProps : {}}
      d={wingPath}
    />
  );

  const wing2 = (
    <motion.path
      id="wing2"
      style={wingStyle}
      animate={{
        ...(animate && {
          ...animateProps,
          rotate: [0, 20, 0],
          translateY: [0, 19, 0],
          translateX: [0, -7.5, 0],
          scale: [1, 0.8, 1],
        }),
      }}
      d={wingPath}
    />
  );

  const x = 43.845;
  const y = 65.679;
  const width = 135.46697;
  const height = 135.46697;

  // Define the background rectangle
  const bgRect =
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
        <clipPath id="btkBgClip">
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>
      <g clipPath="url(#btkBgClip)">
        {bgRect}
        {animate && wing2}
        {wing}
      </g>
    </svg>
  );
};

export default compose(withTheme, withColors)(Logo);
