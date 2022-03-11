import React, { memo, useEffect, useState } from "react";

import Markdown from "./Markdown";
import Tab from "./Tab";
import classnames from "classnames";
import { compose } from "recompose";
import styles from "./Styles.scss";

const Tabs = () => {
  const [content, setContent] = useState(null);

  let css = classnames(styles.tabHolder);
  const components = {
    ul: (props) => {
      return <nav className={css}>{props.children}</nav>;
    },
    li: (props) => {
      let routeName = props.children[0].replace(/\n$/, "");
      return <Tab routeName={routeName} pageId={`${routeName}.md`} />;
    },
  };

  useEffect(() => {
    setContent(
      <Markdown pageId={"tabs.md"} components={components} siteStyles={true} />
    );
  }, []);
  console.log(content);
  return content;
};

export default compose(memo)(Tabs);
