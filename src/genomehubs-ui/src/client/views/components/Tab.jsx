import NavLink from "./NavLink";
import { compose } from "redux";
import { tabDiv as tabDivStyle } from "./Styles.scss";
import { useEffect } from "react";
import withRoutes from "#hocs/withRoutes";

const Tab = ({ path = "", routeName, pageId, setRoute, routesById }) => {
  let parsedName = routeName.replaceAll(/[()]/g, "");
  let parsedPageId = pageId.replaceAll(/[()]/g, "");
  useEffect(() => {
    if (parsedName && !routesById) {
      setRoute(parsedName, parsedPageId, path);
    }
  }, [parsedName]);

  if (parsedName != routeName) {
    return null;
  }

  return (
    <div className={tabDivStyle}>
      <NavLink to={path ? `${path}/${routeName}` : parsedName} tab plain>
        {parsedName.replace(/^\//g, "").replaceAll(/_/g, " ")}
      </NavLink>
    </div>
  );
};

export default compose(withRoutes)(Tab);
