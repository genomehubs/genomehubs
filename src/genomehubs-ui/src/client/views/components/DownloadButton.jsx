import React, { forwardRef } from "react";

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import ColorButton from "./ColorButton";
import ColorButtonGroup from "./ColorButtonGroup";
import GetAppIcon from "@mui/icons-material/GetApp";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import Paper from "@mui/material/Paper";
import { compose } from "recompose";
import withColors from "#hocs/withColors";
import withTheme from "#hocs/withTheme";

const defaultOptions = {
  TSV: { format: "tsv" },
  CSV: { format: "csv" },
  JSON: { format: "json" },
  "Tidy Data": { format: "tsv", tidyData: true },
  "Raw Values": {
    format: "tsv",
    tidyData: true,
    includeRawValues: true,
  },
};

const DownloadButton = ({
  onButtonClick,
  searchTerm,
  options = defaultOptions,
  // setMessage,
  theme,
  colorScheme,
}) => {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const handleClick = async () => {
    let key = Object.keys(options)[selectedIndex];
    // setMessage({
    //   message: `Downloading ${key} file`,
    //   duration: 60000,
    //   severity: "info",
    // });
    let { format } = options[key];
    let fullOptions = {
      ...searchTerm,
      ...options[key],
      offset: 0,
      size: 10000000,
    };
    delete fullOptions.format;
    delete fullOptions.image;
    let success;
    try {
      success = await onButtonClick({
        options: fullOptions,
        format,
      });
    } catch (err) {
      console.log(err);
    }
    // if (success) {
    //   setMessage({
    //     message: `${key} file downloaded`,
    //     duration: 5000,
    //     severity: "success",
    //   });
    // } else {
    //   setMessage({
    //     message: `${key} file download failed`,
    //     duration: 5000,
    //     severity: "error",
    //   });
    // }
  };

  const handleMenuItemClick = (event, index) => {
    setSelectedIndex(index);
    setOpen(false);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(!open);
  };

  const handleClose = (event) => {
    event.stopPropagation();
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const GroupedButton = forwardRef((props, ref) => (
    <ColorButtonGroup
      variant="contained"
      disableElevation
      // color="primary"
      {...props}
      ref={ref}
      aria-label="split button"
    >
      <ColorButton startIcon={<GetAppIcon />} onClick={handleClick}>
        {Object.keys(options)[selectedIndex]}
      </ColorButton>
      <ColorButton
        // color="primary"
        size="small"
        aria-controls={open ? "split-button-menu" : undefined}
        aria-expanded={open ? "true" : undefined}
        aria-label="select merge strategy"
        aria-haspopup="menu"
        onClick={handleToggle}
      >
        <ArrowDropDownIcon />
      </ColorButton>
    </ColorButtonGroup>
  ));

  return (
    <span
      style={{
        margin: "1em 0 1em auto",
        maxHeight: "2em",
        overflow: "visible",
        backgroundColor: colorScheme[theme].lightColor,
        flex: "0 1 auto",
      }}
    >
      <GroupedButton ref={anchorRef} />
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

export default compose(withTheme, withColors)(DownloadButton);
