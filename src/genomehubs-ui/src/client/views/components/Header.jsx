import React, { memo, useRef } from "react";
import {
  searchIcon as searchIconStyle,
  siteText as siteTextStyle,
  tabHolder as tabHolderStyle,
} from "./Styles.scss";

import { Router } from "@reach/router";
import SearchHeaderButtons from "./SearchHeaderButtons";
import SiteName from "./SiteName";
import Tabs from "./Tabs";
import TabsFixed from "./TabsFixed";
import { compose } from "redux";
import withColors from "#hocs/withColors";
import withSiteName from "../hocs/withSiteName";
import withTheme from "../hocs/withTheme";

const Header = ({ id, levels, theme, colorScheme, basename }) => {
  const rootRef = useRef(null);
  let style = {};
  let colors;
  switch (id) {
    case "bhm":
      colors = levels[4] || levels.default.slice(0, 4);
      break;
    case "pride":
      colors = levels[6] || levels.default.slice(0, 6);
      break;
    default:
      colors = Array(6).fill("currentColor", 0);
  }

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
  } else if (id == "bhm") {
    let height = 100;
    let unit = "%";
    let stops = [
      "0deg",
      colors[3],
      `${colors[3]} ${height / colors.length}${unit}`,
      `${colors[2]} ${height / colors.length}${unit}`,
      `${colors[2]} ${(height / colors.length) * 2}${unit}`,
      `${colors[1]} ${(height / colors.length) * 2}${unit}`,
      `${colors[1]} ${(height / colors.length) * 3}${unit}`,
      `${colors[0]} ${(height / colors.length) * 3}${unit}`,
      `${colors[0]} ${(height / colors.length) * 4}${unit}`,
    ];
    style = { background: `repeating-linear-gradient(${stops.join(", ")})` };
  }
  const buttonColor = colorScheme[theme].headerText;
  return (
    <header style={style} ref={rootRef}>
      <div className={searchIconStyle}>
        <SearchHeaderButtons color={buttonColor} rootRef={rootRef} />
      </div>
      <div style={{ float: "left" }} className={siteTextStyle}>
        <SiteName logo />
      </div>
      <TabsFixed default />
      <Router basepath={basename} className={tabHolderStyle} primary={false}>
        <Tabs default />
      </Router>
    </header>
  );
};

export default compose(memo, withTheme, withColors, withSiteName)(Header);
// export default compose(memo)(Header);
