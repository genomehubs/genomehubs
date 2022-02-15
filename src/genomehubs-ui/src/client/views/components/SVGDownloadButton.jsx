import { saveSvgAsPng, svgAsDataUri } from "save-svg-as-png";

import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import GetAppIcon from "@material-ui/icons/GetApp";
import MenuItem from "@material-ui/core/MenuItem";
import MenuList from "@material-ui/core/MenuList";
import Paper from "@material-ui/core/Paper";
import React from "react";
import { withStyles } from "@material-ui/core/styles";

const ColorButtonGroup = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText("#333333"),
    backgroundColor: "#333333",
    "&:hover": {
      backgroundColor: "#999999",
    },
  },
}))(ButtonGroup);

const SVGDownloadButton = ({ targetRef, filename, string }) => {
  const options = {
    PNG: { format: "png" },
    SVG: { format: "svg" },
    NWK: { format: "nwk" },
  };
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const downloadLink = (uri, filename) => {
    const link = document.createElement("a");
    link.href = uri;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  const handleClick = () => {
    let key = Object.keys(options)[selectedIndex];
    let format = options[key].format;
    let opts = {
      excludeCss: true,
      scale: 2,
    };
    if (format == "png") {
      saveSvgAsPng(targetRef.current, `${filename}.png`, opts);
    } else if (format == "svg") {
      svgAsDataUri(targetRef.current, opts).then((uri) => {
        downloadLink(uri, `${filename}.svg`);
      });
    } else if (format == "nwk") {
      downloadLink(`data:text/plain;base64,${btoa(string)}`, `${filename}.nwk`);
    }
  };

  const handleMenuItemClick = (event, index) => {
    setSelectedIndex(index);
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    event.stopPropagation();
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  return (
    <span
      style={{
        margin: "1em 0 1em auto",
        maxHeight: "2em",
        overflow: "visible",
        backgroundColor: "white",
        flex: "0 1 auto",
      }}
    >
      <ColorButtonGroup
        variant="contained"
        disableElevation
        // color="primary"
        ref={anchorRef}
        aria-label="split button"
      >
        <Button startIcon={<GetAppIcon />} onClick={handleClick}>
          {Object.keys(options)[selectedIndex]}
        </Button>
        <Button
          // color="primary"
          size="small"
          aria-controls={open ? "split-button-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          aria-label="select merge strategy"
          aria-haspopup="menu"
          onClick={handleToggle}
        >
          <ArrowDropDownIcon />
        </Button>
      </ColorButtonGroup>

      <Paper style={{ height: open ? "auto" : 0, overflow: "hidden" }}>
        <ClickAwayListener onClickAway={handleClose}>
          <MenuList id="split-button-menu">
            {Object.keys(options).map((option, index) => (
              <MenuItem
                key={option}
                selected={index === selectedIndex}
                onClick={(event) => handleMenuItemClick(event, index)}
              >
                {option}
              </MenuItem>
            ))}
          </MenuList>
        </ClickAwayListener>
      </Paper>
    </span>
  );
};

export default SVGDownloadButton;
