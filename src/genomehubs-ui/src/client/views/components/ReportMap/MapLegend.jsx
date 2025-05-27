import React, { useState } from "react";

import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import Switch from "@mui/material/Switch";
import { mixColor } from "../../functions/mixColor";
import { transform } from "proj4";

const ColorRampBar = ({ min, max, color1, bg, getColor }) => {
  const borderRadius = 6;
  // Compute mid value
  const mid = max - min > 10 ? Math.round((min + max) / 2) : (min + max) / 2;
  // Gradient CSS
  const gradient = `linear-gradient(90deg, ${getColor(min)} ${borderRadius}px, ${getColor(max)} calc(100% - ${borderRadius}px)`;
  return (
    <div
      style={{ width: 180, marginBottom: 8, position: "relative", height: 28 }}
    >
      {/* Tick marks */}
      {[min, mid, max].map((val, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${((val - min) / (max - min || 1)) * 100}%`,
            marginLeft:
              i == 0 ? `${borderRadius}px` : i == 2 ? `-${borderRadius}px` : 0,
            top: 18, // move label below ramp and tick
            transform: "translateX(-50%)",
            textAlign: "center",
            color: "#888",
            fontSize: 12,
            minWidth: 18,
            lineHeight: 1,
            pointerEvents: "none",
            position: "absolute",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "-5px", // place tick just below ramp
              transform: "translateX(-50%)",
              height: "5px",
              borderLeft: "1px solid #888",
              marginBottom: 1,
              width: 0,
              pointerEvents: "none",
            }}
          />
          <span style={{ color: "inherit", position: "relative", zIndex: 1 }}>
            {val}
          </span>
        </div>
      ))}
      <div
        style={{
          height: 14,
          borderRadius,
          background: gradient,
          border: "1px solid #888",
          width: "100%",
        }}
      />
    </div>
  );
};

export const MapLegend = ({
  nightMode,
  theme,
  globeView,
  setGlobeView,
  setNightMode,
  minCountryCount,
  maxCountryCount,
  countryOverlayColor,
  minHexbinCount,
  maxHexbinCount,
  hexbinOverlayColor,
}) => {
  const [showLegend, setShowLegend] = useState(false);
  return (
    <FormGroup
      row
      style={{
        position: "absolute",
        zIndex: 1000,
        right: 20,
        top: 20,
        background: nightMode
          ? "rgba(30,30,30,0.85)"
          : theme === "darkTheme"
            ? "rgba(34,42,56,0.85)"
            : "rgba(255,255,255,0.85)",
        borderRadius: 12,
        boxShadow:
          nightMode || theme === "darkTheme"
            ? "0 2px 8px #0008"
            : "0 2px 8px #8882",
        padding: showLegend ? "0.5em 1em" : "0.5em",
        minWidth: 30,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
        }}
      >
        {showLegend && (
          <>
            <FormControlLabel
              control={
                <Switch
                  checked={globeView}
                  onClick={() => setGlobeView(!globeView)}
                  color={
                    nightMode || theme === "darkTheme" ? "default" : "primary"
                  }
                  sx={
                    nightMode || theme === "darkTheme"
                      ? {
                          "& .MuiSwitch-switchBase": {
                            color: "#bbb",
                          },
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "#ffa870",
                          },
                          "& .MuiSwitch-track": {
                            backgroundColor: "#888",
                          },
                        }
                      : {}
                  }
                />
              }
              label={globeView ? "Globe" : "Map"}
              sx={nightMode || theme === "darkTheme" ? { color: "#eee" } : {}}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={nightMode}
                  onClick={() => setNightMode(!nightMode)}
                  color={
                    nightMode || theme === "darkTheme" ? "default" : "primary"
                  }
                  sx={
                    nightMode || theme === "darkTheme"
                      ? {
                          "& .MuiSwitch-switchBase": {
                            color: "#bbb",
                          },
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "#ffa870",
                          },
                          "& .MuiSwitch-track": {
                            backgroundColor: "#888",
                          },
                        }
                      : {}
                  }
                />
              }
              label={nightMode ? "Night" : "Day"}
              sx={nightMode || theme === "darkTheme" ? { color: "#eee" } : {}}
            />
          </>
        )}
        <IconButton
          size="small"
          onClick={() => setShowLegend((v) => !v)}
          sx={{
            ml: 1,
            color: nightMode || theme === "darkTheme" ? "#eee" : undefined,
            margin: showLegend ? "-0.25em -0.4em 0 0" : 0,
          }}
          aria-label={showLegend ? "Hide legend" : "Show legend"}
        >
          {showLegend ? (
            <MenuOpenIcon style={{ transform: "scaleX(-1)" }} />
          ) : (
            <MenuIcon />
          )}
        </IconButton>
      </div>
      {showLegend && (
        <div style={{ width: "100%", marginTop: 8 }}>
          <div
            style={{
              fontWeight: 600,
              marginBottom: 8,
              color: nightMode || theme === "darkTheme" ? "#eee" : undefined,
            }}
          >
            Country Overlay
          </div>
          <ColorRampBar
            min={minCountryCount}
            max={maxCountryCount}
            color1={countryOverlayColor}
            bg={
              nightMode
                ? "#22262a"
                : theme === "darkTheme"
                  ? "#222a38"
                  : "#eeeeee"
            }
            getColor={(val) =>
              mixColor({
                color1: countryOverlayColor,
                color2: nightMode
                  ? "#22262a"
                  : theme === "darkTheme"
                    ? "#222a38"
                    : "#eeeeee",
                ratio:
                  maxCountryCount - minCountryCount === 0
                    ? 0
                    : (val - minCountryCount) /
                      (maxCountryCount - minCountryCount),
              })
            }
          />
          <div
            style={{
              fontWeight: 600,
              margin: "16px 0 8px 0",
              color: nightMode || theme === "darkTheme" ? "#eee" : undefined,
            }}
          >
            Hexbin Overlay
          </div>
          <ColorRampBar
            min={minHexbinCount}
            max={maxHexbinCount}
            color1={hexbinOverlayColor}
            bg={
              nightMode
                ? "#22262a"
                : theme === "darkTheme"
                  ? "#222a38"
                  : "#eeeeee"
            }
            getColor={(val) =>
              mixColor({
                color1: hexbinOverlayColor,
                color2: nightMode
                  ? "#22262a"
                  : theme === "darkTheme"
                    ? "#222a38"
                    : "#eeeeee",
                ratio:
                  maxHexbinCount - minHexbinCount === 0
                    ? 0
                    : (val - minHexbinCount) /
                      (maxHexbinCount - minHexbinCount),
              })
            }
          />
        </div>
      )}
    </FormGroup>
  );
};

export default MapLegend;
