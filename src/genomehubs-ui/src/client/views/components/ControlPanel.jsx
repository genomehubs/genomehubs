import {
  flexCenterHorizontal as flexCenterHorizontalStyle,
  flexCenter as flexCenterStyle,
  fullWidth as fullWidthStyle,
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  resultPanel as resultPanelStyle,
} from "./Styles.scss";

import React from "react";
import SearchPagination from "./SearchPagination";
import classnames from "classnames";
import { compose } from "redux";
import withSearch from "#hocs/withSearch";

const ControlPanel = ({ pagination }) => {
  let css = classnames(
    infoPanelStyle,
    infoPanel1ColumnStyle,
    resultPanelStyle,
    flexCenterStyle,
    flexCenterHorizontalStyle,
    fullWidthStyle
  );
  let pageDivs = [];
  if (pagination) {
    pageDivs.push(<SearchPagination key={"pagination"} />);
  }

  return <div className={css}>{pageDivs}</div>;
};

export default compose(withSearch)(ControlPanel);
