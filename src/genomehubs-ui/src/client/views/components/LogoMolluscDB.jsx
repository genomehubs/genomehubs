import React from "react";
import { compose } from "recompose";
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
  let bgRect =
    backgroundColor === "transparent" ? null : (
      <rect
        x="43.845234"
        y="65.678574"
        width="100%"
        height="100%"
        fill={backgroundColor}
      />
    );

  // const pathVariants = {
  //   hidden: { pathLength: 0, pathOffset: 1 },
  //   visible: { pathLength: 1, pathOffset: 0 },
  //   exit: { pathLength: 0, pathOffset: 1 },
  // };

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="43.845 65.679 135.46697 135.46697"
      preserveAspectRatio="xMidYMid meet"
    >
      {bgRect}
      <g id="layer1">
        <motion.path
          style={{
            fill: "none",
            stroke: lineColor,
            strokeWidth: 68.26156084,
            strokeLinecap: "round",
            strokeOpacity: fillOpacity,
          }}
          animate={
            animate && {
              pathOffset: [0, 1, 0, 0],
              pathLength: [1, 0, 0, 1],
              time: [0, 0.1, 0.9, 1],
              transition: {
                duration: 4,
                delay,
                repeat: Infinity,
                repeatDelay: 0,
              },
            }
          }
          d="m 327.72762,394.47893 c 3.84563,-34.45396 43.71371,-48.97232 73.5025,-40.34141 48.40442,14.02455 67.24652,70.93487 50.67082,115.34676 C 428.60878,531.89183 353.53931,555.2911 294.70992,530.4845 218.23133,498.23577 190.21306,404.61663 223.3803,331.44923 264.44616,240.85734 376.79449,208.19267 464.25983,249.7902 568.9913,299.59931 606.31766,430.77416 556.24826,532.51399 497.73962,651.40215 347.6795,693.39984 231.68021,634.83183 125.76768,581.35661 70.430726,459.38513 92.81318,343.96965"
          transform="matrix(-0.18650315,-0.0306362,0.0306362,-0.18650315,160.78724,227.73317)"
        />
      </g>
    </svg>
  );
};

export default compose(withTheme, withColors)(Logo);
