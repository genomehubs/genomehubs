import {
  link as linkStyle,
  tabHighlight as tabHighlightStyle,
  tab as tabStyle,
} from "./Styles.scss";

import LaunchIcon from "@mui/icons-material/Launch";
import { Link } from "@reach/router";
import React from "react";
import classnames from "classnames";
import { compose } from "redux";
import { useLocation } from "@reach/router";
import withSiteName from "#hocs/withSiteName";

const NavLink = ({
  to,
  tab,
  plain,
  action = "navigate",
  url,
  basename,
  siteName,
  dispatch,
  ...props
}) => {
  const location = useLocation();
  if (url) {
    to = url;
  } else if (to) {
    to = basename + "/" + to + (plain ? "" : location.search + location.hash);
  }
  let isCurrent = location.pathname.startsWith(to);
  if ((to && to.startsWith("http")) || props.href) {
    to = to || props.href;
    if (
      to.match(/\:\/\//) &&
      (props.title?.startsWith("external:") || !to.match(location.origin))
    ) {
      let { children } = props;
      if (!Array.isArray(children)) {
        children = [children];
      }
      if (children.length == 1 && typeof children[0] === "string") {
        children = children[0].match(/(.{1,12})/g);
        children = children.map((str, i) => (
          <span key={i}>
            {i == children.length - 1 ? (
              <span key={i} style={{ whiteSpace: "nowrap" }}>
                {str}
                <LaunchIcon fontSize="inherit" />
              </span>
            ) : (
              str
            )}
          </span>
        ));
      }
      return (
        <a
          href={to}
          title={(props.title || "").replace(/^external:\s*/, "")}
          target="_blank"
          rel="noopener noreferrer"
          // style={{ whiteSpace: "wrap" }}
        >
          {children}
        </a>
      );
    }
    to = basename + "/" + to.replace(location.origin, "");
  }
  let css = linkStyle;
  if (tab) {
    css = classnames(tabStyle, { [tabHighlightStyle]: isCurrent });
  }
  return (
    <Link
      {...props}
      to={to
        .replace(/\/+/, `${basename}/`)
        .replace(`${basename}${basename}`, basename)
        .replace(/\/\/+/, "/")}
      className={css}
    />
  );
};

export default compose(withSiteName)(NavLink);
