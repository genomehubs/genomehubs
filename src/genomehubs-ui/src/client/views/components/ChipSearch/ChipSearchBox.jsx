import {
  Box,
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import { Modal, Paper } from "@mui/material";
import React, { useCallback, useMemo, useRef, useState } from "react";

import ChipSearch from "./ChipSearch";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/Tune";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
// A wrapper around the ChipSearch component to add buttons for search options
// and submitting the search query.
import SearchIcon from "@mui/icons-material/Search";
import Tooltip from "../Tooltip";
import { Underline } from "./Underline";
import { useStyles } from "./SearchBoxStyles";

function typesByDisplayGroup({ types }) {
  let groupTypes = {};
  Object.entries(types).forEach(([key, value]) => {
    let {
      display_group,
      display_name,
      description = display_name,
      display_level,
    } = value;
    if (!groupTypes[display_group]) {
      groupTypes[display_group] = [];
    }

    groupTypes[display_group].push({
      label: key,
      description,
      display_level,
    });
  });
  return groupTypes;
}

const CustomOptions = ({
  setSearchOptions,
  groupedTypes = {},
  resultColumns = {},
  handleClose = () => {},
}) => {
  const { fields, names, ranks } = resultColumns;
  const [selectedFields, setSelectedFields] = useState([...(fields || [])]);

  const groupSelectors = Object.entries(groupedTypes).map(([group, items]) => {
    const defaultFields = items
      .filter((item) => item.display_level === 1)
      .map((item) => item.label);
    const allSelected = items.every((item) =>
      selectedFields.includes(item.label),
    );
    const noneSelected = items.every(
      (item) => !selectedFields.includes(item.label),
    );
    const isDefaultSelected =
      defaultFields.length > 0 &&
      defaultFields.every((field) => selectedFields.includes(field)) &&
      items.filter((item) => selectedFields.includes(item.label)).length ===
        defaultFields.length;
    return (
      <Box key={group} sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            {group}
          </Typography>
          <Button
            size="small"
            variant={allSelected ? "contained" : "text"}
            sx={{
              mr: 1,
              minWidth: 0,
              px: 1,
              pointerEvents: allSelected ? "none" : "auto",
            }}
            onClick={() => {
              // Select all items in this group
              setSelectedFields((prev) => {
                const groupLabels = items.map((item) => item.label);
                return Array.from(
                  new Set([
                    ...prev.filter((f) => f !== "none"),
                    ...groupLabels,
                  ]),
                );
              });
            }}
          >
            All
          </Button>
          {defaultFields.length > 0 && (
            <Button
              size="small"
              variant={isDefaultSelected ? "contained" : "text"}
              sx={{
                mr: 1,
                minWidth: 0,
                px: 1,
                pointerEvents: isDefaultSelected ? "none" : "auto",
              }}
              onClick={() => {
                // Select only items in this group with display_level 1
                setSelectedFields((prev) => {
                  // Remove any fields from this group that are not in defaultFields
                  const groupLabels = items.map((item) => item.label);
                  // Remove all group fields, then add only defaultFields
                  const filtered = prev.filter(
                    (f) => !groupLabels.includes(f) && f !== "none",
                  );
                  return Array.from(new Set([...filtered, ...defaultFields]));
                });
              }}
            >
              Defaults
            </Button>
          )}
          <Button
            size="small"
            variant={noneSelected ? "contained" : "text"}
            sx={{
              minWidth: 0,
              px: 1,
              pointerEvents: noneSelected ? "none" : "auto",
            }}
            onClick={() => {
              // Deselect all items in this group
              setSelectedFields((prev) => {
                const groupLabels = items.map((item) => item.label);
                return prev.filter((f) => !groupLabels.includes(f));
              });
            }}
          >
            None
          </Button>
        </Box>
        <ButtonGroup
          sx={{
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {items.map((item) => (
            <Button
              size="small"
              key={item.label}
              variant={
                selectedFields.includes(item.label) ? "contained" : "outlined"
              }
              onClick={() => {
                setSelectedFields((prev) => {
                  if (prev.includes(item.label)) {
                    return prev.filter((f) => f !== item.label);
                  }
                  return [...prev, item.label];
                });
              }}
              sx={{
                mb: 1,
                ...(item.selected && {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                }),
                "&.MuiButtonGroup-middleButton": {
                  borderRightColor: "primary.main",
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </ButtonGroup>
        <Underline />
      </Box>
    );
  });

  return (
    <Paper
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        padding: 2,
        outline: "none",
        minWidth: 500,
        maxHeight: "90vh",
        overflowY: "auto",
        zIndex: 1300,
        boxShadow: "0px -8px 16px -8px rgba(0,0,0,0.15)",
      }}
    >
      <Box sx={{ position: "relative" }}>
        <DialogTitle
          sx={{
            backgroundColor: "primary.main",
            color: "white",
            fontSize: "1.25rem",
            fontWeight: "bold",
            padding: "1em",
            textAlign: "center",
            position: "sticky",
            top: "-1em",
            left: 0,
            right: 0,
            zIndex: 1300, // Ensure it appears above other content
            mt: -2,
            ml: -2,
            mr: -2,
            mb: 2,
            pb: 1,
            boxShadow: "0px 8px 12px -4px rgba(0,0,0,0.12)",
          }}
        >
          <Typography sx={{ mb: 2, textAlign: "center", fontSize: "2rem" }}>
            Result Columns
          </Typography>
        </DialogTitle>

        <Typography
          variant="body1"
          sx={{ mb: 2, fontStyle: "italic", textAlign: "center" }}
        >
          Select fields to include in the search results.
        </Typography>
        <Underline />
        {groupSelectors}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            mt: 2,
            ml: -2,
            mr: -2,
            mb: -2,
            position: "sticky",
            bottom: "-1em",
            backgroundColor: "white",
            padding: 1,
            zIndex: 1300,
            boxShadow: "0px -8px 12px -8px rgba(0,0,0,0.12)",
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setSearchOptions({
                fields: selectedFields.length > 0 ? selectedFields : ["none"],
              });
              handleClose();
            }}
          >
            Apply Changes
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setSelectedFields([...fields])}
          >
            Reset
          </Button>
          <Button variant="outlined" color="primary" onClick={handleClose}>
            Close
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

const SearchOptions = ({
  currentResult,
  availableResults = currentResult ? [currentResult] : [],
  includeEstimates = false,
  emptyColumns = false,
  includeDescendants,
  setSearchOptions = () => {},
  types = {},
  resultColumns = {},
  resetSearch = () => {},
  handleClose = () => {},
}) => {
  const [showCustomOptions, setShowCustomOptions] = useState(false);
  const groupedTypes = useMemo(() => {
    let grouped = typesByDisplayGroup({ types });
    // sort each group by display_level, then by label
    Object.entries(grouped).forEach(([group, items]) => {
      grouped[group] = items.sort((a, b) => {
        if (a.display_level !== b.display_level) {
          return a.display_level - b.display_level;
        }
        return a.label.localeCompare(b.label);
      });
    });
    return grouped;
  }, [types]);
  const defaultFields = useMemo(() => {
    return Object.entries(groupedTypes).reduce((acc, [group, items]) => {
      const defaultItems = items.filter((item) => item.display_level === 1);
      return [...acc, ...defaultItems.map((item) => item.label)];
    }, []);
  }, [groupedTypes]);
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
                  pointerEvents:
                    isCurrentOption &&
                    !["custom"].includes(option) &&
                    options.length > 1
                      ? "none"
                      : "auto",
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

  let currentColumnsOption = "default";
  let selectedDefaultsLength = 0;
  for (let key of ["fields", "names", "ranks"]) {
    if (resultColumns[key] && resultColumns[key].length > 0) {
      if (resultColumns[key].length == 1 && resultColumns[key][0] === "none") {
        currentColumnsOption = "none";
        break;
      }
      for (let field of resultColumns[key]) {
        if (defaultFields.includes(field)) {
          selectedDefaultsLength++;
        } else {
          currentColumnsOption = "custom";
        }
      }
    }
  }
  if (
    currentColumnsOption === "default" &&
    selectedDefaultsLength !== defaultFields.length
  ) {
    currentColumnsOption = "custom";
  }

  return (
    <Paper
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        padding: 0,
        outline: "none",
        minWidth: 350,
        maxHeight: "90vh",
        overflowY: "auto",
        overflowX: "hidden",
        filter: showCustomOptions ? "blur(2px)" : "none",
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "primary.main",
          color: "white",
          fontSize: "1.25rem",
          fontWeight: "bold",
          padding: "1em",
          textAlign: "center",
          position: "sticky",
          top: "0em",
          left: 0,
          right: 0,
          zIndex: 1300, // Ensure it appears above other content

          mb: 3,
          pb: 1,
          boxShadow: "0px 8px 12px -4px rgba(0,0,0,0.12)",
        }}
      >
        <Typography sx={{ mb: 2, textAlign: "center", fontSize: "2rem" }}>
          Search Options
        </Typography>
      </DialogTitle>

      <Typography
        variant="body1"
        sx={{ mb: 2, fontStyle: "italic", textAlign: "center" }}
      >
        Change common search options.
      </Typography>
      <Underline />
      <OptionGroup
        title="Search Index"
        helpText="Select the index to search in"
        currentOption={currentResult}
        options={availableResults}
        setCurrentOption={(result) => setSearchOptions({ result })}
        underline={true}
      />
      {currentResult == "taxon" && (
        <OptionGroup
          title="Include Estimates"
          helpText="Include rows with only estimated values in the search results"
          currentOption={includeEstimates ? "yes" : "no"}
          options={["yes", "no"]}
          setCurrentOption={(value) =>
            setSearchOptions({ includeEstimates: value === "yes" })
          }
          underline={true}
        />
      )}
      {currentResult == "taxon" &&
        typeof includeDescendants !== "undefined" && (
          <OptionGroup
            title="Include Descendants"
            helpText="Include descendant taxa in the search results"
            currentOption={includeDescendants ? "yes" : "no"}
            options={["yes", "no"]}
            setCurrentOption={(value) =>
              setSearchOptions({ includeDescendants: value === "yes" })
            }
            underline={true}
          />
        )}
      <OptionGroup
        title="Result Columns"
        helpText="Select the columns to display in the search results"
        currentOption={currentColumnsOption}
        options={["default", "custom", "none"]}
        setCurrentOption={(value) => {
          if (value === "default") {
            setSearchOptions({
              fields: defaultFields,
              names: [],
              ranks: [],
            });
          } else if (value === "custom") {
            // open a dialog to select custom columns
            setShowCustomOptions(true);
          } else if (value === "none") {
            setSearchOptions({
              fields: ["none"],
              names: [],
              ranks: [],
            });
          }
        }}
        underline={true}
      />
      <OptionGroup
        title="Show Empty Columns"
        helpText="Toggle the visibility of columns with no data in the search results"
        currentOption={emptyColumns ? "yes" : "no"}
        options={["yes", "no"]}
        setCurrentOption={(value) =>
          setSearchOptions({ emptyColumns: value === "yes" })
        }
        underline={true}
      />
      <OptionGroup
        title="Clear All"
        helpText="Clear the search query and all options"
        currentOption="clear all"
        options={["clear all"]}
        setCurrentOption={() => {
          resetSearch();
        }}
        color="error"
        sx={{ backgroundColor: "error.main" }}
      />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 2,
          mt: 2,
          position: "sticky",
          bottom: 0,
          backgroundColor: "white",
          padding: 1,
          zIndex: 1300,
          boxShadow: "0px -8px 12px -8px rgba(0,0,0,0.12)",
        }}
      >
        <Button variant="contained" color="primary" onClick={handleClose}>
          Close
        </Button>
      </Box>
      <Modal
        open={showCustomOptions}
        onClose={() => setShowCustomOptions(false)}
        disableEnforceFocus
      >
        <Box tabIndex={-1}>
          <CustomOptions
            groupedTypes={groupedTypes}
            resultColumns={resultColumns}
            setSearchOptions={setSearchOptions}
            handleClose={() => setShowCustomOptions(false)}
          />
        </Box>
      </Modal>
    </Paper>
  );
};

const ChipSearchBox = React.memo(
  ({
    types,
    results,
    searchOptions: initialSearchOptions = {},
    handleSubmit = () => {},
    resetSearch,
    ...props
  }) => {
    const classes = useStyles();

    // Memoize initialSearchOptions to avoid unnecessary state resets
    const stableInitialSearchOptions = useMemo(
      () => initialSearchOptions,
      [initialSearchOptions],
    );
    const [value, setValue] = useState(stableInitialSearchOptions.query || "");
    const [showOptions, setShowOptions] = useState(false);
    const [searchOptions, setSearchOptions] = useState({
      ...stableInitialSearchOptions,
    });

    const optionsButtonRef = useRef(null);

    const toggleOptions = useCallback(() => {
      setShowOptions((prev) => !prev);
    }, []);

    const { compact } = props;
    const {
      result,
      includeEstimates,
      emptyColumns,
      fields,
      names,
      ranks,
      query = "",
    } = searchOptions;

    let includeDescendants;
    if (typeof searchOptions.includeDescendants !== "undefined") {
      includeDescendants = searchOptions.includeDescendants;
    } else if (query && query.match(/tax_(name|tree|eq)/)) {
      includeDescendants = query.match(/tax_tree/) || false;
    }

    const updateOptions = useCallback((newOptions) => {
      // setSearchOptions((prevOptions) => ({
      //   ...prevOptions,
      //   ...newOptions,
      // }));
      const updatedOptions = {
        ...searchOptions,
        ...newOptions,
        query: value,
      };
      handleSubmit(updatedOptions);
    }, []);

    // Memoize searchButton to avoid rerendering ChipSearch
    const searchButton = useMemo(() => {
      let options = {};
      for (let [key, value] of Object.entries(searchOptions)) {
        if (key.match(/query[A-Z]/)) {
          if (value.result) {
            options[key] = `${value.result}--${value.query}`;
          } else {
            options[key] = value.query;
          }
        } else {
          options[key] = value;
        }
      }
      let query = value;
      query = query.replace(/(=|>|>=|<|<=|!=)\s+AND/g, " AND");
      query = query.replace(/(=|>|>=|<|<=|!=)\s*$/, "");
      return (
        <ButtonGroup sx={{}}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SearchIcon />}
            className={classes.searchButton}
            onClick={() => {
              handleSubmit({ ...options, query });
            }}
          >
            {result}
          </Button>
          <Button
            ref={optionsButtonRef}
            variant="outlined"
            color="primary"
            className={classes.searchButton}
            onClick={toggleOptions}
          >
            {showOptions ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </Button>
        </ButtonGroup>
      );
    }, [
      classes.searchButton,
      handleSubmit,
      searchOptions,
      value,
      result,
      showOptions,
      toggleOptions,
    ]);

    // Memoize handleValueChange to avoid rerendering ChipSearch
    const handleValueChange = useCallback((value) => {
      setValue(value);
    }, []);

    const inputQueries = useMemo(() => {
      const queries = {};
      Object.entries(searchOptions).forEach(([key, value]) => {
        if (key.match(/query[A-Z]/) && value.query) {
          queries[key] = {
            query: value.query,
            result: value.result || result,
            fields: value.fields || [],
          };
        }
      });
      return queries;
    }, [searchOptions, result]);

    return (
      <Box
        sx={useMemo(
          () => ({
            display: "inline-flex",
            flexDirection: compact ? "row" : "column",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            filter: showOptions ? "blur(2px)" : "none",
            border: "1px solid palette.divider",
            borderRadius: "12px",
            maxWidth: "75vw",
            padding: compact ? "4px 12px" : "8px 24px",
            paddingBottom: compact ? "8px" : "16px",
            backgroundColor: "background.paper",
            boxShadow: "0px 2px 8px rgba(0,0,0,0.5)",
          }),
          [compact, showOptions],
        )}
      >
        <ChipSearch
          types={types}
          searchButton={searchButton}
          inputQueries={inputQueries}
          handleValueChange={handleValueChange}
          handleInputQueryChange={(query) =>
            setSearchOptions((prev) => ({ ...prev, ...query }))
          }
          result={result}
          results={results}
          compact={compact}
          {...props}
        />
        <Modal
          open={showOptions}
          onClose={() => setShowOptions(false)}
          disableEnforceFocus
        >
          <Box tabIndex={-1}>
            <SearchOptions
              currentResult={result}
              availableResults={results}
              includeEstimates={includeEstimates}
              includeDescendants={includeDescendants}
              emptyColumns={emptyColumns}
              setSearchOptions={updateOptions}
              resultColumns={{ fields, names, ranks }}
              types={types}
              resetSearch={resetSearch}
              handleClose={() => setShowOptions(false)}
            />
          </Box>
        </Modal>
      </Box>
    );
  },
);

export default ChipSearchBox;
