import { useLocation, useNavigate } from "@reach/router";

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import LinkIcon from "@mui/icons-material/Link";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import Paper from "@mui/material/Paper";
import React from "react";
import { compose } from "recompose";
import withSiteName from "../hocs/withSiteName";
import withStyles from "@mui/styles/withStyles";

const ColorButton = withStyles((theme) => ({
  root: {
    color: "black", // theme.palette.getContrastText("#e0e0e0"),
    backgroundColor: "#e0e0e0",
    "&:hover": {
      backgroundColor: "#d5d5d5",
    },
    height: "36px",
  },
}))(Button);

const LinkButton = ({ options, basename }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const permaLink = () => {
    let pathname = location.pathname.replace(/^\//, "");
    if (pathname == options[0]) {
      pathname = options[1];
    } else {
      pathname = options[0];
    }
    navigate(`${basename}/${pathname}${location.search}${location.hash}}`);
  };

  return (
    <ColorButton
      // color="primary"
      size="small"
      aria-controls={open ? "split-button-menu" : undefined}
      aria-expanded={open ? "true" : undefined}
      aria-label="select merge strategy"
      aria-haspopup="menu"
      onClick={permaLink}
    >
      <LinkIcon />
    </ColorButton>
  );
};

export default compose(withSiteName)(LinkButton);
