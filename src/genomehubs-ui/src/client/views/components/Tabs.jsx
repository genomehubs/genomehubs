import React, { memo, useEffect, useState } from "react";

import Markdown from "./Markdown";
import NavLink from "./NavLink";
import Tab from "./Tab";
import { compose } from "recompose";
import styles from "./Styles.scss";
import withRoutes from "../hocs/withRoutes";

const TabGroupComponent = ({
  routeName,
  pageId,
  setRoute,
  routesById,
  group,
}) => {
  const [visible, setVisible] = useState(false);
  let parsedName = routeName.replaceAll(/\+/g, "");
  let parsedPageId = pageId.replaceAll(/\+/g, "");
  useEffect(() => {
    if (parsedName && !routesById) {
      setRoute(parsedName, parsedPageId);
    }
  }, [parsedName]);

  return (
    <div
      onPointerEnter={() => setVisible(true)}
      onPointerLeave={() => setVisible(false)}
      className={styles.tabDiv}
    >
      <NavLink to={parsedName} tab plain>
        {parsedName}
      </NavLink>
      <div
        className={styles.nestedTab}
        style={{ height: visible ? "auto" : 0 }}
      >
        <Tabs group={`${group}-${parsedName}`} />
      </div>
    </div>
  );
};

const TabGroup = compose(withRoutes)(TabGroupComponent);

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
      } else if (routeName.match(/^\//)) {
        return (
          <Tab path={""} routeName={routeName} pageId={`${routeName}.md`} />
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
