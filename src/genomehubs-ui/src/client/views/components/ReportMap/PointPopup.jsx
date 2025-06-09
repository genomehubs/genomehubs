import React from "react";
import ReportPopup from "./ReportPopup";

export const PointPopup = ({
  theme,
  nightMode,
  setPointPopupMeta,
  pointPopupMeta,
  pointLink,
  oceanColor,
  navigate,
}) => {
  const { scientific_name, taxonId, lat, lng, cat } = pointPopupMeta;
  let title = scientific_name;
  let detail = `${Math.round(lat * 1000) / 1000}, ${Math.round(lng * 1000) / 1000}`;
  if (cat && !cat.match(/^all /i)) {
    detail = `${detail} (${cat})`;
  }
  return (
    <ReportPopup
      theme={theme}
      position="bottom-left"
      nightMode={nightMode}
      onClose={() => setPointPopupMeta(null)}
      title={title}
      detail={detail}
      link={pointLink(pointPopupMeta.lat, pointPopupMeta.lng)}
      handleLinkClick={() =>
        navigate(pointLink(pointPopupMeta.lat, pointPopupMeta.lng))
      }
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
            <circle
              cx={50}
              cy={50}
              r={20}
              fill={pointPopupMeta.fillColor}
              stroke="#fff"
              strokeWidth={5}
            />
          </svg>
        </div>
      }
    />
  );
};

export default PointPopup;
