import {
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  textPanel as textPanelStyle,
} from "./Styles.scss";

import NavLink from "./NavLink";
import Page from "./Page";
import classnames from "classnames";
import { useLocation } from "@reach/router";

const NotFoundPanel = ({ path }) => {
  let css = classnames(infoPanelStyle, infoPanel1ColumnStyle, textPanelStyle);
  return (
    <div className={css}>
      <h1>Page not found</h1>
      <p>
        The requested URL <b>{path}</b> was not found
      </p>
      <p>
        Try a new search or visit the{" "}
        <NavLink to="/" plain>
          home page
        </NavLink>
      </p>
    </div>
  );
};

const MissingPage = ({}) => {
  const location = useLocation();
  let text = <NotFoundPanel path={location.pathname} />;
  return <Page searchBox panels={[{ panel: text }]} />;
};

export default MissingPage;
