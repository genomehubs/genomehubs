import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import React from "react";
import Switch from "@mui/material/Switch";
import Tooltip from "./Tooltip";
import { compose } from "redux";
import withTheme from "#hocs/withTheme";

export const ToggleTheme = ({ theme, setTheme }) => {
  const toggleTheme = () => {
    setTheme(theme === "lightTheme" ? "darkTheme" : "lightTheme");
  };

  return (
    <FormControl
      variant="standard"
      //   className={classes.formControl}
      // style={{ margin: "-8px 0 0", transform: "scale(0.75)" }}
    >
      <FormHelperText>{"change theme"}</FormHelperText>
      <FormControlLabel
        control={
          <Switch
            id={"toggle-theme"}
            checked={theme == "darkTheme"}
            onChange={() => {
              toggleTheme();
            }}
            name="theme-switch"
            color="default"
          />
        }
        label={theme == "darkTheme" ? "dark" : "light"}
      />
    </FormControl>
  );
};

export default compose(withTheme)(ToggleTheme);
