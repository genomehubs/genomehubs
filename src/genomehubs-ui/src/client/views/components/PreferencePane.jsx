import React from "react";
import { compose } from "recompose";
import classnames from "classnames";
import styles from "./Preferences.scss";
import withExpansion from "../hocs/withExpansion";
import PreferedTheme from "./PreferedTheme";

const PreferencePane = (props) => {
  return (
    <div className={styles.preferencePane}>
      <span className={styles.transparent}>
        <span
          className={classnames(styles.transparent, styles.preferenceLabel)}
        >
          Theme:
        </span>
        <PreferedTheme />
      </span>
    </div>
  );
};

export default compose(withExpansion)(PreferencePane);
