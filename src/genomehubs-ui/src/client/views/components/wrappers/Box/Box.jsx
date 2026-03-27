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

const Box = (
  {
    shadow = "none",
    padded = false,
    center = false,
    row = false,
    col = false,
    sx = {},
    children,
    ...rest
  },
  ref,
) => {
  const boxShadow = resolveShadow(shadow);

  // capture the underlying DOM node for debugging and to ensure the
  // forwarded ref receives the same node. We use a callback ref so we can
  // both set a local ref and forward to the incoming ref (function or ref
  // object).
  const innerRef = React.useRef(null);
  const handleRef = React.useCallback(
    (node) => {
      innerRef.current = node;
      if (!ref) return;
      try {
        if (typeof ref === "function") ref(node);
        else if (typeof ref === "object") ref.current = node;
      } catch (err) {
        /* ignore */
      }
    },
    [ref],
  );

  // no-op: previously used for debugging forwarded refs

  const computedSx = {
    ...(padded ? { p: 2 } : {}),
    ...(center
      ? { display: "flex", alignItems: "center", justifyContent: "center" }
      : {}),
    ...(row ? { display: "flex", flexDirection: "row" } : {}),
    ...(col ? { display: "flex", flexDirection: "column" } : {}),
    ...(boxShadow ? { boxShadow } : {}),
    // NOTE: `sx` can be either an object or a function (theme) => sx. We
    // must preserve that shape when combining computedSx with the provided
    // `sx`. If `sx` is a function, create a new function that merges the
    // computedSx with the result of the user `sx(theme)` call.
  };

  const finalSx =
    typeof sx === "function"
      ? (theme) => ({ ...computedSx, ...sx(theme) })
      : { ...computedSx, ...sx };

  return (
    <MuiBox ref={handleRef} sx={finalSx} {...rest}>
      {children}
    </MuiBox>
  );
};

export default React.forwardRef(Box);
