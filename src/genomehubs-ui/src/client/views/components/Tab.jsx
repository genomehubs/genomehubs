import React, { memo, useEffect } from "react";

import NavLink from "./NavLink";
import { compose } from "recompose";
import withRoutes from "../hocs/withRoutes";

const Tab = ({ routeName, pageId, setRoute, routesById }) => {
  useEffect(() => {
    if (routeName && !routesById) {
      setRoute(routeName, pageId);
    }
  }, [routeName]);

  return (
    <NavLink to={routeName} tab>
      {routeName}
    </NavLink>
  );
};

export default compose(withRoutes)(Tab);
