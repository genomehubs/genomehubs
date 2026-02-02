import {
  flexRow as flexRowStyle,
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel2Column as infoPanel2ColumnStyle,
  infoPanel3Column as infoPanel3ColumnStyle,
  infoPanel4Column as infoPanel4ColumnStyle,
  infoPanel as infoPanelStyle,
} from "./Styles.scss";

import InfoPane from "./InfoPane";
import classnames from "classnames";

const styleMap = {
  infoPanel1ColumnStyle,
  infoPanel2ColumnStyle,
  infoPanel3ColumnStyle,
  infoPanel4ColumnStyle,
};

const InfoPanel = (props) => {
  let css = classnames(
    flexRowStyle,
    infoPanelStyle,
    styleMap[`infoPanel${props.cols}ColumnStyle`],
  );
  let infoPanes = props.panes.map((pane, i) => {
    return <InfoPane id={pane.id} key={pane.id} {...pane} />;
  });
  return <div className={css}>{infoPanes}</div>;
};

export default InfoPanel;
