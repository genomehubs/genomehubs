import React, { memo } from "react";

import { Link } from "@reach/router";
import { compose } from "recompose";
import styles from "./Styles.scss";

const siteName = SITENAME || "/";
const basename = BASENAME || "";

const SiteName = () => {
  return (
    <Link className={styles.siteName} to={`${basename}/`}>
      {siteName}
    </Link>
  );
};

export default compose(memo)(SiteName);
