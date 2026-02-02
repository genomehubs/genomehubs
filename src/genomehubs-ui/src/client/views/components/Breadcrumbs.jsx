import { A } from "storybook/internal/components";
import LaunchIcon from "@mui/icons-material/Launch";
import { Link } from "@reach/router";
import NavLink from "./NavLink";
import classnames from "classnames";
import { compose } from "redux";
import styles from "./Styles.scss";
import { useLocation } from "@reach/router";
import withSiteName from "#hocs/withSiteName";

const Breadcrumbs = ({
  basename,
  children,
  siteNameLong,
  citationUrl,
  siteName,
  ...props
}) => {
  const location = useLocation();
  let trail = [];
  let pathname = location.pathname.replace(``, "/");
  let parts = pathname.split("/");
  let link = "";
  let title = "";
  parts.forEach((part, i) => {
    let name = part;
    if (part == "") {
      link += ``;
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
      if (Array.isArray(children) && children.length > 0) {
        title = children[0];
      } else if (typeof children == "string") {
        title = children;
      }
      trail.push(<span key={`i`}>{title}</span>);
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
      <h1>{title}</h1>
    </>
  );
};

export default compose(withSiteName)(Breadcrumbs);
