import React, { memo, useEffect, useState } from "react";
import {
  nestedTab as nestedTabStyle,
  tabDiv as tabDivStyle,
} from "./Styles.scss";

import Markdown from "./Markdown";
import NavLink from "./NavLink";
import Tab from "./Tab";
import { compose } from "recompose";
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
      className={tabDivStyle}
    >
      <NavLink to={parsedName} tab plain>
        {parsedName}
      </NavLink>
      <div className={nestedTabStyle} style={{ height: visible ? "auto" : 0 }}>
        <Tabs group={`${group}-${parsedName}`} />
      </div>
    </div>
  );
};

const TabGroup = compose(withRoutes)(TabGroupComponent);

const Tabs = ({ group = "tabs" }) => {
  const [content, setContent] = useState(null);

  let css;
  const components = {
    ul: (props) => {
      return <nav className={css}>{props.children}</nav>;
    },
    li: (props) => {
      let routeName = props.children[0].replace(/\r?\n$/, "");
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
      />,
    );
  }, []);
  return content;
};

export default compose(memo)(Tabs);
