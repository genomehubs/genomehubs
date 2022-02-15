import React, { useEffect } from "react";
import {
  RehypeComponentsList,
  compile,
  processProps,
} from "./MarkdownFunctions";

import { compose } from "recompose";
import styles from "./Styles.scss";
import withPages from "../hocs/withPages";
import { withStyles } from "@material-ui/core/styles";

const MarkdownInclude = ({ pageId, pagesById, fetchPages }) => {
  useEffect(() => {
    if (pageId && !pagesById) {
      fetchPages(pageId);
    }
  }, [pageId]);

  const { contents, ast } = compile(pagesById, {
    ...RehypeComponentsList,
  });

  return <>{contents}</>;
};

export default compose(withPages, withStyles(styles))(MarkdownInclude);
