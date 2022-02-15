import InfoPane from "./InfoPane";
import React from "react";
import classnames from "classnames";
import styles from "./Styles.scss";

const InfoPanel = (props) => {
  let css = classnames(
    styles.flexRow,
    styles.infoPanel,
    styles[`infoPanel${props.cols}Column`]
  );
  let infoPanes = props.panes.map((pane, i) => {
    return <InfoPane id={pane.id} key={pane.id} {...pane} />;
  });
  return <div className={css}>{infoPanes}</div>;
};

export default InfoPanel;
