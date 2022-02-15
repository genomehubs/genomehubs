import React, { memo } from "react";

import { Router } from "@reach/router";
import SiteName from "./SiteName";
import Tabs from "./Tabs";
import { compose } from "recompose";
import styles from "./Styles.scss";

const basename = BASENAME || "";

const Header = () => {
  return (
    <header>
      <SiteName />
      <Router basepath={basename} className={styles.tabHolder} primary={false}>
        <Tabs default />
      </Router>
    </header>
  );
};

export default compose(memo)(Header);
