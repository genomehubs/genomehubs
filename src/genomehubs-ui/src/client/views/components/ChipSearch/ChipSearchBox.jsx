import {
  Box,
  Button,
  ButtonGroup,
  IconButton,
  Typography,
} from "@mui/material";
import { Modal, Paper } from "@mui/material";
import React, { useRef, useState } from "react";

import ChipSearch from "./ChipSearch";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/MoreVert";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
// A wrapper around the ChipSearch component to add buttons for search options
// and submitting the search query.
import SearchIcon from "@mui/icons-material/Search";
import Tooltip from "../Tooltip";
import { current } from "@reduxjs/toolkit";
import { useStyles } from "./SearchBoxStyles";

const SearchOptions = ({
  currentResult,
  setCurrentResult = () => {},
  availableResults = currentResult ? [currentResult] : [],
  includeEstimates = false,
  setIncludeEstimates = () => {},
  showEmptyColumns = false,
  setShowEmptyColumns = () => {},
  resultColumns = {},
  setResultColumns = () => {},
  resetSearch = () => {},
}) => {
  const Underline = () => (
    <hr style={{ border: "0.5px solid gray", width: "100%", opacity: 0.75 }} />
  );
  const OptionGroup = ({
    title,
    helpText,
    currentOption,
    options,
    setCurrentOption,
    sx = {},
    underline,
  }) => {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            mb: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              flex: 1,
              textAlign: "center",
              marginTop: 0,
              marginBottom: -1,
            }}
          >
            {title}
          </Typography>
          {helpText && (
            <Box sx={{ position: "absolute", right: 0 }}>
              <Tooltip title={helpText}>
                <IconButton size="small" sx={{ color: "inherit" }}>
                  <HelpOutlineIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
        <ButtonGroup sx={{ display: "flex", justifyContent: "center" }}>
          {options.map((option) => {
            const isCurrentOption = currentOption === option;
            return (
              <Button
                key={option}
                variant={isCurrentOption ? "contained" : "outlined"}
                onClick={() => setCurrentOption(option)}
                sx={{
                  ...sx,
                  pointerEvents: isCurrentOption ? "none" : "auto",
                }}
              >
                {option}
              </Button>
            );
          })}
        </ButtonGroup>
        {underline && <Underline />}
      </Box>
    );
  };
  return (
    <Paper
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        padding: 2,
        outline: "none",
        minWidth: 200,
        maxHeight: "100%",
        overflowY: "auto",
      }}
    >
      <OptionGroup
        title="Search Index"
        helpText="Select the index to search in"
        currentOption={currentResult}
        options={availableResults}
        setCurrentOption={setCurrentResult}
        underline={true}
      />
      {currentResult == "taxon" && (
        <OptionGroup
          title="Include Estimates"
          helpText="Include rows with only estimated values in the search results"
          currentOption={includeEstimates ? "Yes" : "No"}
          options={["Yes", "No"]}
          setCurrentOption={(option) => setIncludeEstimates(option === "Yes")}
          underline={true}
        />
      )}
      <OptionGroup
        title="Result Columns"
        helpText="Select the columns to display in the search results"
        currentOption={"default"}
        options={["default", "custom", "none"]}
        setCurrentOption={setResultColumns}
        sx={{
          "& .MuiButtonBase-root": {
            background:
              "linear-gradient(\
    to right,\
    red 20%,\
    orange 20% 40%,\
    yellow 40% 60%,\
    green 60% 80%,\
    blue 80% \
  )",
          },
        }}
        underline={true}
      />
      <OptionGroup
        title="Show Empty Columns"
        helpText="Toggle the visibility of columns with no data in the search results"
        currentOption={showEmptyColumns ? "Yes" : "No"}
        options={["Yes", "No"]}
        setCurrentOption={(option) => setShowEmptyColumns(option === "Yes")}
        underline={true}
      />
      <OptionGroup
        title="Reset Search"
        helpText="Reset the search query and options"
        currentOption="Reset"
        options={["Reset"]}
        setCurrentOption={() => {
          resetSearch();
        }}
      />
    </Paper>
  );
};
const ChipSearchBox = ({
  result,
  setCurrentResult,
  results,
  includeEstimates,
  setIncludeEstimates,
  showEmptyColumns,
  setShowEmptyColumns,
  resultColumns,
  setResultColumns,
  resetSearch,
  ...props
}) => {
  const classes = useStyles();

  const [showOptions, setShowOptions] = useState(false);

  const optionsButtonRef = useRef(null);

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  const { compact } = props;

  return (
    <Box
      sx={{
        display: "inline-flex",
        flexDirection: compact ? "row" : "column",
        alignItems: "center",
        gap: 1,
        flexWrap: "wrap",
      }}
    >
      <ChipSearch {...props} />
      <ButtonGroup sx={{}}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SearchIcon />}
          className={classes.searchButton}
        >
          {result}
        </Button>
        <Button
          ref={optionsButtonRef}
          variant="contained"
          color="primary"
          className={classes.searchButton}
          onClick={toggleOptions}
        >
          {showOptions ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </Button>
      </ButtonGroup>
      <Modal
        open={showOptions}
        onClose={() => setShowOptions(false)}
        disableEnforceFocus
      >
        <Box tabIndex={-1}>
          <SearchOptions
            currentResult={result}
            setCurrentResult={setCurrentResult}
            availableResults={results}
            includeEstimates={includeEstimates}
            setIncludeEstimates={setIncludeEstimates}
            showEmptyColumns={showEmptyColumns}
            setShowEmptyColumns={setShowEmptyColumns}
            resultColumns={resultColumns}
            setResultColumns={setResultColumns}
            resetSearch={resetSearch}
          />
        </Box>
      </Modal>
    </Box>
  );
};

export default ChipSearchBox;
