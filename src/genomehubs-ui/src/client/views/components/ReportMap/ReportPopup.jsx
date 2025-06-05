import React from "react";
import ReportMenu from "./ReportMenu";

export const ReportPopup = ({
  nightMode,
  theme,
  onClose,
  position = "bottom-left",
  title,
  detail,
  link,
  linkText = "Click here to search",
  handleLinkClick,
  children,
}) => {
  return (
    <ReportMenu
      theme={theme}
      position={position}
      nightMode={nightMode}
      onClose={onClose}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          textAlign: "left",
        }}
      >
        {title && (
          <div style={{ marginBottom: 2, textAlign: "left" }}>{title}</div>
        )}
        {detail && <div style={{ textAlign: "left" }}>{detail}</div>}
        {link && (
          <div style={{ textAlign: "left" }}>
            <a href={link} onClick={handleLinkClick}>
              {linkText}
            </a>
          </div>
        )}
        {children}
      </div>
    </ReportMenu>
  );
};

export default ReportPopup;
