import React, { useMemo, useState } from "react";

import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MuiCloseIcon from "@mui/icons-material/Close";
import Switch from "@mui/material/Switch";
import getMapOptions from "./functions/getMapOptions";
import { mixColor } from "../../functions/mixColor";
import { transform } from "proj4";

export const ReportMenu = ({
  nightMode,
  theme,
  toggleOpenIcon,
  toggleClosedIcon,
  closeIcon = <MuiCloseIcon />,
  onClose,
  position = "top-right",
  children,
}) => {
  const anchors = position.split("-");
  let top, left, bottom, right;
  let closedIconTransform = {};
  if (anchors[0] === "top") {
    top = 20;
  } else if (anchors[0] === "bottom") {
    bottom = 20;
  } else {
    top = "50%";
  }
  if (anchors[1] === "left") {
    left = 20;
  } else if (anchors[1] === "right") {
    right = 20;
    closedIconTransform = { transform: "scaleX(-1)" };
  } else {
    left = "50%";
    right = "50%";
  }
  const [showMenu, setShowMenu] = useState(Boolean(onClose));

  let color, backgroundColor;
  if (nightMode) {
    color = "#eee";
    backgroundColor = "rgba(30,30,30,0.85)";
  } else if (theme === "darkTheme") {
    color = "#eee";
    backgroundColor = "rgba(34,42,56,0.85)";
  } else {
    color = "#000";
    backgroundColor = "rgba(255,255,255,0.85)";
  }

  let currentIcon;
  if (onClose) {
    currentIcon = closeIcon;
  } else if (showMenu) {
    currentIcon = toggleClosedIcon || (
      <MenuOpenIcon style={closedIconTransform} />
    );
  } else {
    currentIcon = toggleOpenIcon || <MenuIcon />;
  }

  return (
    <FormGroup
      row
      style={{
        position: "absolute",
        zIndex: 1000,
        top,
        right,
        bottom,
        left,
        background: backgroundColor,
        color,
        borderRadius: 12,
        boxShadow:
          nightMode || theme === "darkTheme"
            ? "0 2px 8px #0008"
            : "0 2px 8px #8882",
        padding: "0.5em",
        paddingLeft: showMenu ? "1.5em" : "0.5em",
        // minWidth: 30,
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          height: "100%",
        }}
      >
        {showMenu && children}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "flex-start",
          height: "100%",
          // marginLeft: "0.5em",
        }}
      >
        <IconButton
          onClick={(e) =>
            showMenu && onClose ? onClose(e) : setShowMenu((v) => !v)
          }
          sx={{
            color: nightMode || theme === "darkTheme" ? "#eee" : undefined,
            margin: 0,
          }}
          aria-label={showMenu ? "Hide legend" : "Show legend"}
        >
          {currentIcon}
        </IconButton>
      </div>
    </FormGroup>
  );
};

export default ReportMenu;
