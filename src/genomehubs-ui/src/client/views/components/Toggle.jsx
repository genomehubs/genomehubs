import { memo, useState } from "react";

import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import Tooltip from "./Tooltip";
import { compose } from "redux";
import withColors from "#hocs/withColors";
import withTheme from "#hocs/withTheme";

const Toggle = ({
  toggle,
  expand,
  title,
  children,
  palettes,
  levels,
  colors,
  colorScheme,
  theme,
}) => {
  const [showContent, setShowContent] = useState(Boolean(expand));
  let { linkColor } = colorScheme[theme];
  return (
    <Grid
      style={{
        border: `0.2em solid ${linkColor}66`,
        borderRadius: "1em",
        overflow: "hidden",
        marginBottom: "2em",
      }}
    >
      <div style={{ width: "100%" }}>
        <Grid
          container
          direction="row"
          style={{
            backgroundColor: `${linkColor}33`,
            borderBottom: showContent ? `0.2em solid ${linkColor}66` : "none",
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
    </Grid>
  );
};

export default compose(memo, withTheme, withColors)(Toggle);
