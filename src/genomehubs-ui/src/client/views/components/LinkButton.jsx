import { useLocation, useNavigate } from "@reach/router";

import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import LinkIcon from "@material-ui/icons/Link";
import MenuItem from "@material-ui/core/MenuItem";
import MenuList from "@material-ui/core/MenuList";
import Paper from "@material-ui/core/Paper";
import React from "react";
import { compose } from "recompose";
import withSiteName from "../hocs/withSiteName";
import { withStyles } from "@material-ui/core/styles";

const ColorButton = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText("#e0e0e0"),
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
