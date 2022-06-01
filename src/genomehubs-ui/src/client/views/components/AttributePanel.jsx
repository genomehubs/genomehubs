import AttributeTable from "./AttributeTable";
import React from "react";
import classnames from "classnames";
import styles from "./Styles.scss";

const AttributePanel = ({
  attributes,
  result,
  taxonId,
  title = "Attributes",
}) => {
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.resultPanel
  );

  return (
    <div className={css}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
      </div>
      <div>
        <AttributeTable
          attributes={attributes}
          result={result}
          taxonId={taxonId}
        />
      </div>
    </div>
  );
};

export default AttributePanel;
