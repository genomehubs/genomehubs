import {
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  textPanel as textPanelStyle,
} from "./Styles.scss";

import Markdown from "./Markdown";
import classnames from "classnames";
import { compose } from "redux";
import { memo } from "react";

const TextPanel = ({ pageId, ...overrideStyles }) => {
  let css = classnames(infoPanelStyle, infoPanel1ColumnStyle, textPanelStyle);
  return (
    <div className={css} id={"textPanel"} style={overrideStyles}>
      <Markdown pageId={pageId} />
    </div>
  );
};

export default compose(memo)(TextPanel);
