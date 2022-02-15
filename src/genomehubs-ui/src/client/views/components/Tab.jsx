import React, { memo, useEffect } from "react";

import { compose } from "recompose";
import withRoutes from "../hocs/withRoutes";
import NavLink from "./NavLink";

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
