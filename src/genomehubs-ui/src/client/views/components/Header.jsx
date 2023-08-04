import React, { memo } from "react";

import { Router } from "@reach/router";
import SiteName from "./SiteName";
import Tabs from "./Tabs";
import TabsFixed from "./TabsFixed";
import { compose } from "recompose";
import styles from "./Styles.scss";
import withColors from "../hocs/withColors";

const basename = BASENAME || "";

const Header = ({ id, levels }) => {
  let style = {};
  let colors =
    id == "pride"
      ? levels[6] || levels.default.slice(0, 6)
      : Array(6).fill("currentColor", 0);

  if (id == "pride") {
    let height = 100;
    let unit = "%";
    let stops = [
      "0deg",
      colors[5],
      `${colors[5]} ${height / colors.length}${unit}`,
      `${colors[4]} ${height / colors.length}${unit}`,
      `${colors[4]} ${(height / colors.length) * 2}${unit}`,
      `${colors[3]} ${(height / colors.length) * 2}${unit}`,
      `${colors[3]} ${(height / colors.length) * 3}${unit}`,
      `${colors[2]} ${(height / colors.length) * 3}${unit}`,
      `${colors[2]} ${(height / colors.length) * 4}${unit}`,
      `${colors[1]} ${(height / colors.length) * 4}${unit}`,
      `${colors[1]} ${(height / colors.length) * 5}${unit}`,
      `${colors[0]} ${(height / colors.length) * 5}${unit}`,
      `${colors[0]} ${(height / colors.length) * 6}${unit}`,
    ];
    style = { background: `repeating-linear-gradient(${stops.join(", ")})` };
  }
  return (
    <header style={style}>
      <div style={{ float: "left" }} className={styles.siteText}>
        <SiteName logo />
      </div>
      <TabsFixed default />
      <Router basepath={basename} className={styles.tabHolder} primary={false}>
        <Tabs default />
      </Router>
    </header>
  );
};

export default compose(memo, withColors)(Header);
