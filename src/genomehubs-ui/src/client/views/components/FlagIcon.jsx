import React, { useRef } from "react";

import Flag from "react-country-flag";
import useResize from "#hooks/useResize";

export const FlagIcon = ({ countryCode = "", size = 100 }) => {
  const divRef = useRef();
  const { width, height } = useResize(divRef);
  if (height > 0 && width > 0) {
    size = Math.min(width, height);
  }
  return (
    <div ref={divRef} style={{ height: "100%", width: "100%" }}>
      <Flag
        countryCode={countryCode.toUpperCase()}
        svg
        style={{ width, height }}
      />
    </div>
  );
};

export default FlagIcon;
