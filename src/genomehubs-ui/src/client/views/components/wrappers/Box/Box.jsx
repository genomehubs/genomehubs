import MuiBox from "@mui/material/Box";
import React from "react";

const shadowMap = { sm: 1, md: 3, lg: 8, xl: 12 };

const resolveShadow = (shadow) => {
  if (!shadow || shadow === "none") return undefined;
  if (typeof shadow === "number") return (theme) => theme.shadows[shadow];
  if (typeof shadow === "string") {
    const idx = shadowMap[shadow];
    if (idx !== undefined) return (theme) => theme.shadows[idx];
    return shadow;
  }
  return undefined;
};

export default function Box({
  shadow = "none",
  padded = false,
  center = false,
  row = false,
  col = false,
  sx = {},
  children,
  ...rest
}) {
  const boxShadow = resolveShadow(shadow);

  const computedSx = {
    ...(padded ? { p: 2 } : {}),
    ...(center
      ? { display: "flex", alignItems: "center", justifyContent: "center" }
      : {}),
    ...(row ? { display: "flex", flexDirection: "row" } : {}),
    ...(col ? { display: "flex", flexDirection: "column" } : {}),
    ...(boxShadow ? { boxShadow } : {}),
    ...sx,
  };

  return (
    <MuiBox sx={computedSx} {...rest}>
      {children}
    </MuiBox>
  );
}
