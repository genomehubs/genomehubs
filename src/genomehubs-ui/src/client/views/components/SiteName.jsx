import { Link, useLocation } from "@reach/router";
import React, { memo, useState } from "react";
import {
  siteLogo as siteLogoStyle,
  siteName as siteNameStyle,
} from "./Styles.scss";

import LaunchIcon from "@mui/icons-material/Launch";
import Logo from "./Logo";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import { compose } from "recompose";
import makeStyles from "@mui/styles/makeStyles";
import withArchive from "../hocs/withArchive";
import withSiteName from "../hocs/withSiteName";

const useStyles = makeStyles((theme) => ({
  typography: {
    padding: 8,
  },
}));

const SiteName = ({ siteName, basename, archive, logo, theme }) => {
  const classes = useStyles(theme);
  const [anchorEl, setAnchorEl] = useState(null);
  let location;
  try {
    location = useLocation();
  } catch {
    location = {};
  }

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  let content = (
    <Link className={siteNameStyle} to={`${basename}/`}>
      {logo && (
        <div className={siteLogoStyle}>
          <Logo />
        </div>
      )}
      {siteName}
    </Link>
  );
  let version = basename ? basename.replace("/", "") : "latest";
  let versions;
  if (archive) {
    versions = archive
      .filter((v) => v != version && v > "")
      .map((v) => (
        <MenuItem
          component="a"
          key={v}
          href={`${version == "latest" ? `/${v}` : ""}${location.pathname
            .replace(version, v)
            .replace(/\/latest/, "")}${location.search}${location.hash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <p style={{ margin: "0.5em", whiteSpace: "nowrap" }}>
            {v} <LaunchIcon fontSize="inherit" />
          </p>
        </MenuItem>
      ));
    if (versions && versions.length > 0) {
      content = (
        <span style={{ whiteSpace: "nowrap" }}>
          {content}
          {" - "}
          <span
            aria-describedby={id}
            style={{
              cursor: "pointer",
              fontSize: "0.9em",
              lineHeight: "1em",
              color: "#bbbbbb",
            }}
            onClick={handleClick}
          >
            {version}
          </span>

          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
          >
            {versions}
          </Popover>
        </span>
      );
    }
  }
  return content;
};

export default compose(memo, withSiteName, withArchive)(SiteName);
