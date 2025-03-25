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
  fillOpacity = 0,
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

  return (
    <svg
      height="100%"
      viewBox="43.845234 65.678574 135.46666 135.46666"
      preserveAspectRatio="xMinYMin"
    >
      {bgRect}
      <g id="layer1">
        <path
          style={{ fill: "none", stroke: lineColor, strokeWidth: 6.35 }}
          d="m 135.65868,142.93323 c -3.74596,13.5314 -17.69337,14.12532 -30.88725,16.44924 -29.975751,5.27984 -47.704015,-1.76881 -18.331467,-31.9466 9.651652,-9.91625 19.322437,-21.03455 32.300547,-17.25684 12.97808,3.7777 20.6641,19.22279 16.91817,32.7542 z"
        />
        <path
          style={{ fill: lineColor }}
          d="m 126.99393,113.67648 c 0,0 -0.62683,-11.32791 13.06036,-14.770453 10.47769,-2.635308 39.43316,1.848983 39.43316,1.848983 0,0 -23.15099,-10.969808 -39.87489,-9.590171 -16.7239,1.379637 -22.65896,14.144511 -23.52112,16.656591 -1.32643,3.86481 10.90249,5.85505 10.90249,5.85505 z"
        />
        <path
          style={{ fill: "none", stroke: lineColor, strokeWidth: 6.5 }}
          d="M 110.64018,202.51165 V 159.10356"
        />
        <path
          style={{ fill: "none", stroke: lineColor, strokeWidth: 7 }}
          d="M 129.21481,203.92495 V 152.84472"
          transform="rotate(-8.1526193,162.90047,203.45574)"
        />
        <motion.ellipse
          style={{
            fill: "none",
            fillOpacity,
            stroke: lineColor,
            strokeWidth: 2.7,
          }}
          cx="73.043381"
          cy="148.5984"
          rx="4.9599605"
          ry="3.6476221"
          transform="rotate(-16.128394)"
          animate={
            animate && {
              ry: [3.6476221, 0.1, 3.6476221],
              transition: {
                duration: 1,
                delay: delay + 10,
                repeat: Infinity,
                repeatDelay: 10,
              },
            }
          }
        />
        <path
          style={{ fill: lineColor }}
          d="m 72.173957,151.97816 c 0,0 1.995699,4.20085 7.598019,2.75614 4.288636,-1.10595 13.832973,-8.39828 13.832973,-8.39828 0,0 -6.183001,8.48883 -12.47398,11.27165 -6.290979,2.78282 -10.930675,-0.64856 -11.733652,-1.38382 -1.235373,-1.13119 2.77664,-4.24569 2.77664,-4.24569 z"
        />
        <path
          style={{ fill: lineColor }}
          d="m 71.772986,154.25578 c 0,0 -1.566687,-2.57724 1.210774,-5.09975 2.12618,-1.93101 9.476713,-4.50868 9.476713,-4.50868 0,0 -6.802528,0.32967 -10.550479,2.74914 -3.747953,2.41947 -3.539589,6.15599 -3.426877,6.853 0.173402,1.07233 3.289869,0.007 3.289869,0.007 z"
        />
        <motion.path
          style={{
            fill: "none",
            stroke: lineColor,
            strokeWidth: 5.8,
            strokeLineCap: "round",
          }}
          animate={
            animate && {
              pathOffset: [0, 0, 0, 1],
              pathLength: [0, 1, 1, 1],
              time: [0, 0.1, 0.9, 1],
              transition: {
                duration: 4,
                delay,
                repeat: Infinity,
                repeatDelay: 0,
              },
            }
          }
          d="M 38.580337,101.47897 118.18676,62.030086"
        />
      </g>
    </svg>
  );
};

export default compose(withTheme, withColors)(Logo);
