import Markdown from "./Markdown";
import React from "react";
import classnames from "classnames";
import styles from "./Styles.scss";

const TaxonSummaryPanel = ({ taxon_id }) => {
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.resultPanel
  );

  return (
    <div className={css}>
      <div className={styles.header}>
        <span className={styles.title}>Taxon Summary</span>
      </div>
      <Markdown pageId={"taxon_summary.md"} taxon_id={taxon_id} />
    </div>
  );
};

export default TaxonSummaryPanel;
