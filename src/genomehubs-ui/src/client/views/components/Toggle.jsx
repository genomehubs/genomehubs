import React, { useRef, useState } from "react";

import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import Grid from "@material-ui/core/Grid";
import Switch from "@material-ui/core/Switch";
import Tooltip from "@material-ui/core/Tooltip";

const Toggle = ({ toggle, expand, title, children }) => {
  const [showContent, setShowContent] = useState(expand);
  return (
    <Grid
      container
      direction="column"
      style={{
        border: "0.2em solid #98999f",
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
            backgroundColor: "#eeeeee",
            borderBottom: showContent ? "0.2em solid #98999f" : "none",
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
      {showContent && (
        <Grid item xs={12}>
          {children}
        </Grid>
      )}
    </Grid>
  );
};

export default Toggle;
