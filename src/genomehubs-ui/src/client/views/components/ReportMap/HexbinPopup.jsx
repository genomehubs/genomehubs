import React from "react";
import ReportPopup from "./ReportPopup";

export const HexbinPopup = ({
  theme,
  nightMode,
  setHexbinPopupMeta,
  hexbinPopupMeta,
  hexbinLink,
  fill,
  stroke,
  oceanColor,
  navigate,
}) => {
  // Rotate the hexagon by 30 degrees so the top is flat
  // Calculate points for a flat-topped hexagon centered in the SVG
  const size = 40; // radius from center to any corner
  const centerX = 50;
  const centerY = 50;
  const hexPoints = Array.from({ length: 6 })
    .map((_, i) => {
      const angleDeg = 60 * i - 30; // flat-topped
      const angleRad = (Math.PI / 180) * angleDeg;
      const x = centerX + size * Math.cos(angleRad);
      const y = centerY + size * Math.sin(angleRad);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <ReportPopup
      theme={theme}
      position="bottom-left"
      nightMode={nightMode}
      onClose={() => setHexbinPopupMeta(null)}
      title={`H3: ${hexbinPopupMeta.h3}`}
      detail={`Count: ${hexbinPopupMeta.count}`}
      link={hexbinLink(hexbinPopupMeta.h3)}
      handleLinkClick={() => navigate(hexbinLink(hexbinPopupMeta.h3))}
      children={
        <div
          style={{
            height: "10em",
            width: "10em",
            position: "relative",
            background: oceanColor,
            borderRadius: 8,
            overflow: "hidden",
            margin: "0.5em 0",
          }}
        >
          <svg
            viewBox="0 0 100 100"
            style={{
              width: "100%",
              height: "100%",
            }}
          >
            <polygon
              points={hexPoints}
              fill={fill}
              stroke={stroke}
              strokeWidth={0.5}
            />
          </svg>
        </div>
      }
    />
  );
};

export default HexbinPopup;
