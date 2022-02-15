import React from "react";
import { withStyles } from "@material-ui/core/styles";
import AutorenewIcon from "@material-ui/icons/Autorenew";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import ReplayIcon from "@material-ui/icons/Replay";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import Paper from "@material-ui/core/Paper";
import MenuItem from "@material-ui/core/MenuItem";
import MenuList from "@material-ui/core/MenuList";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";

// const SettingsButton =()=>{
//   return <Grid item>
//     <Button
//       variant="contained"
//       color="default"
//       disableElevation
//       className={classes.button}
//       startIcon={<AutorenewIcon />}
//       onClick={handleClick}
//     >
//       Update
//     </Button>
//   </Grid>
//   <Grid item>
//     <Button
//       variant="contained"
//       color="default"
//       disableElevation
//       className={classes.button}
//       startIcon={<ReplayIcon />}
//       onClick={handleResetClick}
//     >
//       Reset
//     </Button>
//   </Grid>
// }

const ColorButtonGroup = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText("#333333"),
    backgroundColor: "#333333",
    "&:hover": {
      backgroundColor: "#999999",
    },
  },
}))(ButtonGroup);

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
        <Button
          startIcon={options[current].icon}
          onClick={options[current].func}
        >
          {current}
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
