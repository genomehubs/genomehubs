import React from "react";
import SearchPagination from "./SearchPagination";
import classnames from "classnames";
import { compose } from "recompose";
import { format } from "d3-format";
import styles from "./Styles.scss";
import withSearch from "../hocs/withSearch";

const ControlPanel = ({
  fetchSearchResults,
  searchResults,
  searchResultArray,
  pagination,
  options,
}) => {
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.resultPanel,
    styles.flexCenter,
    styles.flexCenterHorizontal,
    styles.fullWidth
  );
  let pageDivs = [];
  if (pagination) {
    pageDivs.push(<SearchPagination key={"pagination"} />);
  }

  return <div className={css}>{pageDivs}</div>;
};

export default compose(withSearch)(ControlPanel);
