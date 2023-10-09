import React, { memo, useEffect } from "react";

import NavLink from "./NavLink";
import { compose } from "recompose";
import styles from "./Styles.scss";
import withRoutes from "../hocs/withRoutes";

const Tab = ({ path = "", routeName, pageId, setRoute, routesById }) => {
  let parsedName = routeName.replaceAll(/[\(\)]/g, "");
  let parsedPageId = pageId.replaceAll(/[\(\)]/g, "");
  useEffect(() => {
    if (parsedName && !routesById) {
      setRoute(parsedName, parsedPageId);
    }
  }, [parsedName]);

  if (parsedName != routeName) {
    return null;
  }

  return (
    <div className={styles.tabDiv}>
      <NavLink to={path ? `${path}/${routeName}` : parsedName} tab plain>
        {parsedName}
      </NavLink>
    </div>
  );
};

export default compose(withRoutes)(Tab);
