import React, { useState } from "react";
import { compose } from "recompose";
import withTheme from "../hocs/withTheme";
import styles from "./Preferences.scss";
import ToggleSwitch from "./ToggleSwitch";

const PreferedTheme = ({ theme, setTheme }) => {
  return (
    <ToggleSwitch
      id={"preferedTheme"}
      styles={styles}
      checked={theme != "Dark"}
      text={["Light", "Dark"]}
      onChange={() => {
        setTheme(theme == "Light" ? "Dark" : "Light");
      }}
    />
  );
};

export default compose(withTheme)(PreferedTheme);
