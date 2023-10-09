import React, { memo, useEffect, useState } from "react";

import Markdown from "./Markdown";
import Tab from "./Tab";
import TabGroup from "./TabGroup";
import classnames from "classnames";
import { compose } from "recompose";
import styles from "./Styles.scss";

const Tabs = ({ group = "tabs" }) => {
  const [content, setContent] = useState(null);

  let css; // = classnames(styles.tabHolder);
  const components = {
    ul: (props) => {
      return <nav className={css}>{props.children}</nav>;
    },
    li: (props) => {
      let routeName = props.children[0].replace(/\n$/, "");
      if (routeName.match(/\+/)) {
        return (
          <TabGroup
            routeName={routeName}
            pageId={`${routeName}.md`}
            group={group}
          />
        );
      } else {
        let path = group.replaceAll("-", "/").replace(/\btabs\b/, "");
        return (
          <Tab path={path} routeName={routeName} pageId={`${routeName}.md`} />
        );
      }
    },
  };

  useEffect(() => {
    setContent(
      <Markdown
        pageId={`${group}.md`}
        components={components}
        siteStyles={true}
      />
    );
  }, []);
  return content;
};

export default compose(memo)(Tabs);
