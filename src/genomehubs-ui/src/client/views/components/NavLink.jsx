import LaunchIcon from "@material-ui/icons/Launch";
import { Link } from "@reach/router";
import React from "react";
import classnames from "classnames";
import styles from "./Styles.scss";
import { useLocation } from "@reach/router";

const NavLink = ({ to, tab, url, ...props }) => {
  const location = useLocation();
  if (url) {
    to = url;
  } else if (to) {
    to = "/" + to + location.search + location.hash;
  } else if (props.href) {
    if (props.href.match(/\:\/\//)) {
      return (
        <a
          href={props.href}
          // target="_blank"
          // rel="noopener noreferrer"
          onClick={() => console.log(props.href)}
        >
          {props.children}
          <LaunchIcon fontSize="inherit" />
        </a>
      );
    }
    to = "/" + props.href + location.search + location.hash;
  }
  return (
    <Link
      {...props}
      to={to.replace(/\/+/, "/")}
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

export default NavLink;
