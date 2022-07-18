import React, { memo, useState } from "react";

import { Link } from "@reach/router";
import Popover from "@material-ui/core/Popover";
import Typography from "@material-ui/core/Typography";
import { compose } from "recompose";
import { makeStyles } from "@material-ui/core/styles";
import styles from "./Styles.scss";
import withArchive from "../hocs/withArchive";
import withSiteName from "../hocs/withSiteName";

const useStyles = makeStyles((theme) => ({
  typography: {
    padding: theme.spacing(1),
  },
}));

const SiteName = ({ siteName, basename, archive }) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  let content = (
    <Link className={styles.siteName} to={`${basename}/`}>
      {siteName}
    </Link>
  );
  let version = basename ? basename.replace("/", "") : "latest";
  let versions;
  if (archive) {
    versions = archive
      .filter((v) => v != version && v > "")
      // .map((v) => <Typography className={classes.typography}>{v}</Typography>);
      .map((v) => (
        <Link key={v} to={`/${v}/`}>
          <Typography className={classes.typography}>{v}</Typography>
        </Link>
      ));
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
            color: "gray",
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
  return content;
};

export default compose(memo, withSiteName, withArchive)(SiteName);
