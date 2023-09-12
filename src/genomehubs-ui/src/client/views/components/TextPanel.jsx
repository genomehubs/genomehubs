import React, { memo } from "react";

import Markdown from "./Markdown";
import classnames from "classnames";
import { compose } from "recompose";
import styles from "./Styles.scss";

const TextPanel = ({ pageId, ...overrideStyles }) => {
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.textPanel
  );
  return (
    <div className={css} id={"textPanel"} style={overrideStyles}>
      <Markdown pageId={pageId} />
    </div>
  );
};

export default compose(memo)(TextPanel);
