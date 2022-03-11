import React, { memo } from "react";

import NavLink from "./NavLink";
import classnames from "classnames";
import { compose } from "recompose";
import styles from "./Styles.scss";

const TabsFixed = () => {
  let css = classnames(styles.tabHolder);
  let content = [
    <NavLink key={"sources"} to={"sources"} tab>
      {"sources"}
    </NavLink>,
  ];

  return <span className={css}>{content}</span>;
};

export default compose(memo)(TabsFixed);
