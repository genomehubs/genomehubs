import LaunchIcon from "@mui/icons-material/Launch";
import { Link } from "@reach/router";
import NavLink from "./NavLink";
import React from "react";
import classnames from "classnames";
import { compose } from "recompose";
import styles from "./Styles.scss";
import { useLocation } from "@reach/router";
import withSiteName from "#hocs/withSiteName";

const Breadcrumbs = ({ basename, children, ...props }) => {
  const location = useLocation();
  let trail = [];
  let pathname = location.pathname.replace(`${basename}/`, "/");
  let parts = pathname.split("/");
  let link = "";
  parts.forEach((part, i) => {
    let name = part;
    if (part == "") {
      link += `${basename}/`;
      name = "home";
    } else {
      link += `/${part}`;
    }
    name = name[0].toUpperCase() + name.slice(1);
    if (i < parts.length - 1) {
      trail.push(
        <NavLink key={i} to={link}>
          {name}
        </NavLink>,
      );
    } else {
      trail.push(<span key={`i`}>{children[0]}</span>);
    }
    if (i < parts.length - 1) {
      trail.push(<span key={`${i}_`}> {">"} </span>);
    }
  });
  // if (url) {
  //   to = url;
  // } else if (to) {
  //   to = basename + "/" + to + (plain ? "" : location.search + location.hash);
  // }

  return (
    <>
      {trail}
      <h1>{children[0]}</h1>
    </>
  );
};

export default compose(withSiteName)(Breadcrumbs);
