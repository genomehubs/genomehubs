import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import ColorButton from "./ColorButton";
import ColorButtonGroup from "./ColorButtonGroup";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import Paper from "@mui/material/Paper";
import React from "react";
import SearchIcon from "@mui/icons-material/Search";
import Tooltip from "./Tooltip";
import { compose } from "redux";
import withSearch from "../hocs/withSearch";
import withTaxonomy from "../hocs/withTaxonomy";

const indexList = ["taxon", "assembly", "sample", "feature"];

const SearchButton = ({
  searchIndex,
  setSearchIndex,
  indices,
  resetSearch,
  handleClick = () => {},
}) => {
  const options = indexList.filter((index) => indices.includes(index));
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);
  const [selectedIndex, setSelectedIndex] = React.useState(
    options.indexOf(searchIndex),
  );

  const handleMenuItemClick = (e, index) => {
    e.preventDefault();
    setSelectedIndex(index);
    setSearchIndex(options[index]);
    resetSearch();
    handleClick(e, { index: options[index], fields: "" });
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

  return (
    <div
      style={{
        maxHeight: "2em",
        position: "relative",
        overflow: "visible",
        marginLeft: "1em",
        marginTop: "-0.25em",
        zIndex: 10,
      }}
    >
      <span
        style={{
          margin: "1em 0 1em auto",
          maxHeight: "2em",
          overflow: "scroll",
          backgroundColor: "white",
          flex: "0 1 auto",
        }}
      >
        <ColorButtonGroup
          variant="contained"
          color="info"
          disableElevation
          ref={anchorRef}
          aria-label="split button"
        >
          <Tooltip
            title={`Click to search ${options[selectedIndex]} index`}
            arrow
            placement={"top"}
          >
            <ColorButton
              startIcon={<SearchIcon />}
              color="#333333"
              onClick={(e) => {
                handleClick(e, { index: options[selectedIndex] });
              }}
            >
              {options[selectedIndex]}
            </ColorButton>
          </Tooltip>
          <Tooltip title="Change search index" arrow placement={"top"}>
            <ColorButton
              // color="primary"
              color="#333333"
              size="small"
              aria-controls={open ? "split-button-menu" : undefined}
              aria-expanded={open ? "true" : undefined}
              aria-label="select merge strategy"
              aria-haspopup="menu"
              onClick={handleToggle}
            >
              <ArrowDropDownIcon />
            </ColorButton>
          </Tooltip>
        </ColorButtonGroup>

        <Paper
          style={{
            height: open ? "auto" : 0,
            overflow: "hidden",
          }}
        >
          <ClickAwayListener onClickAway={handleClose}>
            <MenuList id="split-button-menu">
              {options.map((option, index) => (
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
    </div>
  );
};

export default compose(withTaxonomy, withSearch)(SearchButton);
