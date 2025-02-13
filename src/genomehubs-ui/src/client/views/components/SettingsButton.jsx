import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import ColorButton from "./ColorButton";
import ColorButtonGroup from "./ColorButtonGroup";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import Paper from "@mui/material/Paper";
import React from "react";
import ReplayIcon from "@mui/icons-material/Replay";

const DownloadButton = ({ handleClick, handleResetClick }) => {
  const options = {
    Update: { icon: <AutorenewIcon />, func: handleClick },
    Reset: { icon: <ReplayIcon />, func: handleResetClick },
  };

  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const handleMenuItemClick = (event, index) => {
    options[Object.keys(options)[index]].func();
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

  let current = Object.keys(options)[selectedIndex];

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
        <ColorButton
          startIcon={options[current].icon}
          onClick={options[current].func}
        >
          {current}
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

      <Paper style={{ height: open ? "auto" : 0, overflow: "hidden" }}>
        <ClickAwayListener onClickAway={handleClose}>
          <MenuList id="split-button-menu">
            {Object.keys(options).map((option, index) => (
              <MenuItem
                key={option}
                selected={index === selectedIndex}
                onClick={(event) => handleMenuItemClick(event, index)}
              >
                <ListItemIcon>{options[option].icon}</ListItemIcon>
                <ListItemText primary={option} />
              </MenuItem>
            ))}
          </MenuList>
        </ClickAwayListener>
      </Paper>
    </span>
  );
};

export default DownloadButton;
