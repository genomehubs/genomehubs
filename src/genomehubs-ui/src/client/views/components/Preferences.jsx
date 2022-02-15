import React, { useState } from "react";
import classnames from "classnames";
import styles from "./Preferences.scss";
import PreferenceHeader from "./PreferenceHeader";
import PreferencePane from "./PreferencePane";

const Preferences = () => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={styles.preferenceOuter}>
      <PreferenceHeader onClick={() => setExpanded(!expanded)} />
      {expanded && <PreferencePane />}
    </div>
  );
};

export default Preferences;
