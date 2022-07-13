import React, { memo } from "react";

import { Link } from "@reach/router";
import { compose } from "recompose";
import styles from "./Styles.scss";
import withSiteName from "../hocs/withSiteName";

const SiteName = ({ siteName, basename }) => {
  return (
    <Link className={styles.siteName} to={`${basename}/`}>
      {siteName}
    </Link>
  );
};

export default compose(memo, withSiteName)(SiteName);
