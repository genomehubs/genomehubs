import Markdown from "./Markdown";
import React from "react";
import classnames from "classnames";
import styles from "./Styles.scss";

const TextPanel = ({ pageId }) => {
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.textPanel
  );
  return (
    <div className={css}>
      <Markdown pageId={pageId} />
    </div>
  );
};

export default TextPanel;
