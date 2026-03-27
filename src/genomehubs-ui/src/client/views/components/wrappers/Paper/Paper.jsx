import React, { forwardRef } from "react";

import MuiPaper from "@mui/material/Paper";

const Paper = forwardRef(function Paper(
  {
    children,
    collapse = false,
    collapsed = false,
    sx = {},
    className,
    elevation = 0,
    style,
    ...other
  },
  ref,
) {
  const collapseStyle = collapse
    ? { height: collapsed ? 0 : "auto", overflow: "hidden" }
    : {};

  return (
    <MuiPaper
      ref={ref}
      elevation={elevation}
      className={className}
      sx={{ p: 1, ...sx }}
      style={{ ...collapseStyle, ...style }}
      {...other}
    >
      {children}
    </MuiPaper>
  );
});

export default Paper;
