import React, { memo, useEffect } from "react";

import NavLink from "./NavLink";
import { compose } from "recompose";
import withRoutes from "../hocs/withRoutes";

const Tab = ({ routeName, pageId, setRoute, routesById }) => {
  let parsedName = routeName.replaceAll(/[\(\)]/g, "");
  useEffect(() => {
    if (parsedName && !routesById) {
      setRoute(parsedName, pageId);
    }
  }, [parsedName]);

  if (parsedName != routeName) {
    return null;
  }

  return (
    <NavLink to={parsedName} tab plain>
      {parsedName}
    </NavLink>
  );
};

export default compose(withRoutes)(Tab);
