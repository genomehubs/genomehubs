import {
  header as headerStyle,
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  resultPanel as resultPanelStyle,
  title as titleStyle,
} from "./Styles.scss";

import React from "react";
import classnames from "classnames";
import { compose } from "recompose";

const AssembliesPanel = () => {
  let css = classnames(infoPanelStyle, infoPanel1ColumnStyle, resultPanelStyle);

  // TODO: Add lookup to link assemblies to samples
  let content = (
    <>
      This feature is under development. <br /> A list of assemblies for this
      sample will be shown here.
    </>
  );

  return (
    <div className={css}>
      <div className={headerStyle}>
        <span className={titleStyle}>Assemblies</span>
      </div>
      <div>{content}</div>
    </div>
  );
};

export default compose()(AssembliesPanel);
