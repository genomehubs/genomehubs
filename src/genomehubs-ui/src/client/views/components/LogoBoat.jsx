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
    duration,
    ease: "linear",
    delay,
  };

  let clouds = (
    <motion.g
      id="clouds"
      initial={{ x: 0 }}
      animate={{ ...(animate && { x: [0, 150] }) }}
      transition={{ ...transitionProps, duration: duration * 2 }}
    >
      <use
        xlinkHref="#shape"
        transform="matrix(0.58872552,0.10604275,0.11221903,-0.55632336,62.39204,137.55367)"
      />
      <use
        xlinkHref="#shape"
        transform="matrix(-0.58872552,0.10604275,-0.11221903,-0.55632336,192.38537,114.27091)"
      />
      <use
        xlinkHref="#shape"
        transform="matrix(-0.58872552,0.10604275,-0.11221903,-0.55632336,160.88926,135.26832)"
      />
    </motion.g>
  );
  if (animate) {
    clouds = (
      <>
        {clouds}
        <g id="clouds-left" transform={"translate(-150, 0)"}>
          {clouds}
        </g>
      </>
    );
  }

  let waves = (
    <motion.g
      id="waves"
      initial={{ x: 0 }}
      animate={{ ...(animate && { x: [0, 150] }) }}
      transition={transitionProps}
    >
      <use
        xlinkHref="#shape"
        transform="matrix(-0.58872552,-0.10604275,-0.11221903,0.55632336,194.80814,153.24412)"
      />
      <use
        xlinkHref="#shape"
        transform="matrix(-0.58872552,-0.10604275,-0.11221903,0.55632336,249.11875,145.57199)"
      />
    </motion.g>
  );
  if (animate) {
    waves = (
      <>
        {waves}
        <g id="waves-left" transform={"translate(-150, 0)"}>
          {waves}
        </g>
      </>
    );
  }

  let ship = (
    <motion.g
      id="ship"
      initial={{ rotate: 0, x: 0, y: 0 }}
      animate={{
        ...(animate && { rotate: [-2, 2, -2], x: [0, 2, 0], y: [0, -2, 0, 0] }),
      }}
      transition={{ ...transitionProps, duration: duration / 2 }}
    >
      <use
        xlinkHref="#shape"
        transform="matrix(-0.28915904,-0.33512219,-0.3235855,0.2676506,225.67861,153.42367)"
      />
      <use
        xlinkHref="#shape"
        transform="matrix(-0.68801615,-0.85520092,-0.82477433,0.63569687,295.80011,183.51549)"
      />
      <use
        xlinkHref="#shape"
        transform="matrix(1.5462594,-0.41610784,-0.36412826,-1.4748847,-73.248575,370.90843)"
      />
      <use
        xlinkHref="#shape"
        transform="matrix(-0.49084973,-0.54627023,-0.52785014,0.45478568,208.15563,163.35964)"
      />
    </motion.g>
  );

  const x = 43.845;
  const y = 63.679;
  const width = 135.46697;
  const height = 135.46697;
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
        <clipPath id="boatBgClip">
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
        <path
          id="shape"
          d="m 126.99393,113.67648 c 0,0 -0.62683,-11.32791 13.06036,-14.770453 10.47769,-2.635308 39.43316,1.848983 39.43316,1.848983 0,0 -23.15099,-10.969808 -39.87489,-9.590171 -16.7239,1.379637 -22.65896,14.144511 -23.52112,16.656591 -1.32643,3.86481 10.90249,5.85505 10.90249,5.85505 z"
        />
      </defs>
      <g clipPath="url(#boatBgClip)" style={{ fill: lineColor }}>
        {bgRect}
        {clouds}
        {waves}
        {ship}
      </g>
    </svg>
  );
};

export default compose(withTheme, withColors)(Logo);
