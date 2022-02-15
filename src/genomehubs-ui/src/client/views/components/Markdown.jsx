import React, { useEffect } from "react";
import {
  RehypeComponentsList,
  compile,
  processProps,
} from "./MarkdownFunctions";

import MarkdownInclude from "./MarkdownInclude";
import classnames from "classnames";
import { compose } from "recompose";
import styles from "./Styles.scss";
import withPages from "../hocs/withPages";
import { withStyles } from "@material-ui/core/styles";

const Markdown = ({
  classes,
  pageId,
  pagesById,
  fetchPages,
  siteStyles,
  components = {},
}) => {
  useEffect(() => {
    if (pageId && !pagesById) {
      fetchPages(pageId);
    }
  }, [pageId]);

  const { contents, ast } = compile(pagesById, {
    ...RehypeComponentsList,
    include: (props) => <MarkdownInclude {...processProps(props)} />,
    ...components,
  });
  let css;
  if (siteStyles) {
    css = classes.root;
  } else {
    css = classnames(styles.markdown, classes.root);
  }
  return <div className={css}>{contents}</div>;
};

export default compose(withPages, withStyles(styles))(Markdown);
