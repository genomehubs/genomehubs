import React, { memo, useEffect, useState } from "react";

import NavLink from "./NavLink";
import Tabs from "./Tabs";
import { compose } from "recompose";
import styles from "./Styles.scss";
import withRoutes from "../hocs/withRoutes";

const TabGroup = ({ routeName, pageId, setRoute, routesById, group }) => {
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

export default compose(withRoutes)(TabGroup);
