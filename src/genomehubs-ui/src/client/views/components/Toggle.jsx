import React, { useRef, useState } from "react";

import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import Grid from "@material-ui/core/Grid";
import Switch from "@material-ui/core/Switch";
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
  // transpColor = "#1f78b411";

  return (
    <Grid
      container
      direction="row"
      style={{
        border: `0.2em solid #1f78b466`,
        borderRadius: "1em",
        overflow: "hidden",
        marginBottom: "2em",
      }}
    >
      <Grid item xs={12}>
        <Grid
          container
          direction="row"
          style={{
            backgroundColor: "#1f78b433",
            borderBottom: showContent ? `0.2em solid #1f78b466` : "none",
          }}
        >
          <Grid item xs={10}>
            <h3 style={{ marginLeft: "1em", fontWeight: "normal" }}>{title}</h3>
          </Grid>
          {toggle && (
            <Tooltip
              title={`Click to toggle visibility`}
              arrow
              placement={"top"}
            >
              <Grid
                item
                xs={2}
                style={{
                  cursor: "pointer",
                  margin: "auto",
                  textAlign: "right",
                }}
              >
                <FormControl
                // className={classes.formControl}
                // style={{ margin: "-8px 0 0", transform: "scale(0.75)" }}
                >
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
      </Grid>
      <Grid
        id="toggleContent"
        item
        xs={12}
        style={{ ...(!showContent && { maxHeight: 0 }) }}
      >
        {children}
      </Grid>
    </Grid>
  );
};

export default compose(withColors)(Toggle);
