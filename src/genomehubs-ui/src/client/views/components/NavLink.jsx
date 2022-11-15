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
  } else if (props.href) {
    if (props.href.match(/\:\/\//)) {
      return (
        <a href={props.href} target="_blank" rel="noopener noreferrer">
          {props.children}
          <LaunchIcon fontSize="inherit" />
        </a>
      );
    }
    to = props.href;
  }
  return (
    <Link
      {...props}
      to={to
        .replace(/\/+/, `${basename}/`)
        .replace(`${basename}${basename}`, basename)
        .replace(/\/\//, "/")}
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
