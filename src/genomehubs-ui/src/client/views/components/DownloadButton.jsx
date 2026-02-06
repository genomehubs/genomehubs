import { forwardRef, useRef, useState } from "react";

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import ColorButton from "./ColorButton";
import ColorButtonGroup from "./ColorButtonGroup";
import GetAppIcon from "@mui/icons-material/GetApp";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import Paper from "@mui/material/Paper";
import { compose } from "redux";
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
  ...props
}) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  const GroupedButton = forwardRef((buttonProps, ref) => (
    <ColorButtonGroup
      variant="contained"
      disableElevation
      // color="primary"
      {...buttonProps}
      ref={ref}
      aria-label="split button"
    >
      <ColorButton
        startIcon={<GetAppIcon />}
        onClick={handleClick}
        data-testid="report-download-main-button"
      >
        {Object.keys(options)[selectedIndex]}
      </ColorButton>
      <ColorButton
        // color="primary"
        size="small"
        aria-controls={open ? "split-button-menu" : undefined}
        aria-expanded={open ? "true" : undefined}
        aria-label="select download format"
        aria-haspopup="menu"
        onClick={handleToggle}
        data-testid="report-download-menu-toggle"
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
      {...props}
    >
      <GroupedButton ref={anchorRef} />
      <Paper
        style={{ height: open ? "auto" : 0, overflow: "hidden" }}
        data-testid="report-download-menu"
      >
        <ClickAwayListener onClickAway={handleClose}>
          <MenuList id="split-button-menu">
            {Object.keys(options).map((option, index) => (
              <MenuItem
                key={option}
                selected={index === selectedIndex}
                onClick={(event) => handleMenuItemClick(event, index)}
                data-testid={`report-download-option-${index}`}
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
