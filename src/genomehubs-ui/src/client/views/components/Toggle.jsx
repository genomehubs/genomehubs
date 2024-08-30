import React, { memo, useRef, useState } from "react";

import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Grid from "@mui/material/Grid2";
import Switch from "@mui/material/Switch";
import Tooltip from "./Tooltip";
import { compose } from "recompose";
import setColors from "../functions/setColors";
import withColors from "../hocs/withColors";

const Toggle = ({
  toggle,
  expand,
  title,
  children,
  palettes,
  levels,
  colors,
}) => {
  const [showContent, setShowContent] = useState(Boolean(expand));
  // ({ levels, colors } = setColors({
  //   palettes,
  //   levels,
  //   count: 6,
  //   colors,
  // }));
  // let transpColor = colors[1].match(/#/)
  //   ? `${colors[1]}33`
  //   : colors[1].replace(/rgb\(/, "rgba(").replace(/\)/, ", 0.1)");
  // transpColor = "#f0f6fa";

  return (
    (<Grid
      style={{
        border: `0.2em solid #1f78b466`,
        borderRadius: "1em",
        overflow: "hidden",
        marginBottom: "2em",
      }}
    >
      <div style={{width: "100%"}}>
        <Grid
          container
          direction="row"
          style={{
            backgroundColor: "#d2e4f0",
            borderBottom: showContent ? `0.2em solid #1f78b466` : "none",
            width: "100%",
          }}
        >
          <Grid size={10}>
            <h3 style={{ marginLeft: "1em", fontWeight: "normal" }}>{title}</h3>
          </Grid>
          {toggle && (
            <Tooltip
              title={`Click to toggle visibility`}
              arrow
              placement={"top"}
            >
              <Grid
                style={{
                  cursor: "pointer",
                  margin: "auto",
                  textAlign: "right",
                }}
                offset={10}
                size={2}
              >
                <FormControl variant="standard">
                  {/* <FormHelperText>{"TMP"}</FormHelperText> */}
                  <FormControlLabel
                    control={
                      <Switch
                        id={"toggle-switch"}
                        checked={showContent}
                        onChange={() => {
                          setShowContent(!showContent);
                        }}
                        name="toggle-switch"
                        color="default"
                      />
                    }
                    label={showContent ? "On" : "Off"}
                  />
                </FormControl>
              </Grid>
            </Tooltip>
          )}
        </Grid>
      </div>
      <div
        id="toggleContent"
        style={{ width: "100%", ...(!showContent && { maxHeight: 0 }) }}
      >
        {children}
      </div>
    </Grid>)
  );
};

export default compose(memo, withColors)(Toggle);
