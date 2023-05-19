import LaunchIcon from "@material-ui/icons/Launch";
import { Link } from "@reach/router";
import React from "react";
import classnames from "classnames";
import { compose } from "recompose";
import styles from "./Styles.scss";
import { useLocation } from "@reach/router";
import withSiteName from "../hocs/withSiteName";

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
  if ((to && to.startsWith("http")) || props.href) {
    to = to || props.href;
    if (
      to.match(/\:\/\//) &&
      (props.title?.startsWith("external:") || !to.match(location.origin))
    ) {
      return (
        <a
          href={to}
          title={(props.title || "").replace(/^external:\s*/, "")}
          target="_blank"
          rel="noopener noreferrer"
        >
          {props.children}
          <LaunchIcon fontSize="inherit" />
        </a>
      );
    }
    to = basename + "/" + to.replace(location.origin, "");
  }
  return (
    <Link
      {...props}
      to={to
        .replace(/\/+/, `${basename}/`)
        .replace(`${basename}${basename}`, basename)
        .replace(/\/\/+/, "/")}
      getProps={({ isCurrent }) => {
        let css = tab
          ? classnames(styles.tab, { [styles.tabHighlight]: isCurrent })
          : styles.link;
        return {
          className: css,
        };
      }}
    />
  );
};

export default compose(withSiteName)(NavLink);
