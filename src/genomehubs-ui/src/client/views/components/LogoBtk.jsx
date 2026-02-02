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

  let dataHexes = (
    <g id="data" style={{ fill: lineColor }}>
      <motion.g
        initial={{ scale: 1 }}
        animate={{ ...(animate && { scale: [1, 1.2, 1] }) }}
        transition={transitionProps}
      >
        <use
          xlinkHref="#data-hex"
          transform="matrix(0.90505758,0,0,0.93337056,112.66343,158.80291)"
        />
      </motion.g>
      <motion.g
        initial={{ scale: 1 }}
        animate={{ ...(animate && { scale: [1, 0.7, 1] }) }}
        transition={transitionProps}
      >
        <use
          xlinkHref="#data-hex"
          transform="matrix(0.67892781,0,0,0.70016676,-107.52375,183.08772)"
        />
      </motion.g>
      <motion.g
        initial={{ scale: 1 }}
        animate={{ ...(animate && { scale: [1, 1.1, 1] }) }}
        transition={transitionProps}
      >
        <use
          xlinkHref="#data-hex"
          transform="matrix(0.70186779,0,0,0.72382437,400.84318,180.62412)"
        />
      </motion.g>
      <motion.g
        initial={{ scale: 1 }}
        animate={{ ...(animate && { scale: [1, 0.9, 1] }) }}
        transition={transitionProps}
      >
        <use
          xlinkHref="#data-hex"
          transform="matrix(0.77880509,0,0,0.80316851,263.89175,-62.052007)"
        />
      </motion.g>
      <motion.g
        initial={{ scale: 1 }}
        animate={{ ...(animate && { scale: [1, 1.3, 1] }) }}
        transition={transitionProps}
      >
        <use
          xlinkHref="#data-hex"
          transform="matrix(0.39411858,0,0,0.40644782,62.348955,-20.739264)"
        />
      </motion.g>
      <motion.g
        initial={{ scale: 1 }}
        animate={{ ...(animate && { scale: [1, 0.7, 1] }) }}
        transition={transitionProps}
      >
        <use
          xlinkHref="#data-hex"
          transform="matrix(0.66339914,0,0,0.68415231,19.702217,419.16898)"
        />
      </motion.g>
      <motion.g
        initial={{ scale: 1 }}
        animate={{ ...(animate && { scale: [1, 1.1, 1] }) }}
        transition={transitionProps}
      >
        <use
          xlinkHref="#data-hex"
          transform="matrix(0.49029021,0,0,0.505628,309.58469,437.7597)"
        />
      </motion.g>
    </g>
  );

  let dataGrid = (
    <g id="grid" style={{ fill: "none", stroke: lineColor, strokeWidth: 3 }}>
      <use
        xlinkHref="#data-grid"
        transform="matrix(0.86389049,0,0,0.89849555,2.3627228,-63.846066)"
      />
      <use
        xlinkHref="#data-grid"
        transform="matrix(0.86389049,0,0,0.89849555,262.24245,-63.846073)"
      />
      <use
        xlinkHref="#data-grid"
        transform="matrix(0.86389049,0,0,0.89849555,392.18231,170.23174)"
      />
      <use
        xlinkHref="#data-grid"
        transform="matrix(0.86389049,0,0,0.89849555,262.24246,404.30957)"
      />
      <use
        xlinkHref="#data-grid"
        transform="matrix(0.86389049,0,0,0.89849555,2.3627349,404.30957)"
      />
      <use
        xlinkHref="#data-grid"
        transform="matrix(0.86389049,0,0,0.89849555,-127.57713,170.23176)"
      />
    </g>
  );

  const x = 0;
  const y = 0;
  const width = 512;
  const height = 512;

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
        <path
          id="data-grid"
          d="M 143.18645,269.13893 -7.2259728,182.29828 -7.2259774,8.6169779 143.18644,-78.223679 293.59887,8.6169698 l 0,173.6813002 z"
        />
        <path
          id="data-hex"
          d="m 158.37288,234.37738 -112.792699,-65.12089 -3e-6,-130.241793 112.792702,-65.120898 112.7927,65.120892 0,130.241789 z"
        />
      </defs>
      <g clipPath="url(#btkBgClip)">
        {bgRect}
        {dataGrid}
        {dataHexes}
      </g>
    </svg>
  );
};

export default compose(withTheme, withColors)(Logo);
