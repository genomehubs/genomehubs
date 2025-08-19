import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Chip,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Snackbar,
  TextField,
} from "@mui/material";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import KeyValueChip, {
  FieldNameMenu,
  parseValue,
  typesToValidation,
} from "../KeyValueChip";
import React, { useEffect, useState } from "react";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Help";
import JoinFullRoundedIcon from "@mui/icons-material/JoinFullRounded";
import JoinInnerRoundedIcon from "@mui/icons-material/JoinInnerRounded";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import Tooltip from "../Tooltip";
import Underline from "./Underline";
import { getChipColor } from "../KeyValueChip/functions/chipPalettes";
import { h } from "hastscript";

const chipToString = (chip) => {
  if (typeof chip === "string") {
    return chip;
  }
  // If chip is an object, extract key, operator, and value
  const { key, operator, value, valueNote, modifier } = chip;
  let chipString;
  if (key === "tax" && modifier) {
    return `tax_${modifier}(${value})`;
  } else if (modifier) {
    if (modifier === "collate") {
      return `collate(${key}, ${value})`;
    }
    if (modifier !== "value") {
      chipString = `${modifier}(${key})`;
    }
  }
  if (!chipString) {
    chipString = key;
  }
  if (operator) {
    // if (value !== "" && typeof value !== "undefined" && value !== null) {
    chipString += `${operator}`;
    // }
  } else {
    chipString += "=";
  }
  if (typeof value !== "undefined" && value !== null) {
    if (valueNote) {
      chipString += `${value}[${valueNote}]`;
    } else {
      chipString += value;
    }
  }
  return chipString;
};

const extractKeyValue = (chip) => {
  let modifier;
  let valueNote;
  let [key, operator, value] = chip.split(/\s*(!=|>=|<=|<|>|=)\s*/);
  if (key.includes("(")) {
    if (value) {
      [modifier, key] = key.split(/\s*\(\s*/);
      key = key.replace(")", "").trim();
    } else {
      // Extract the function and variable
      [modifier, key] = key.split(/\s*\(\s*/);
      key = key.replace(")", "").trim();
      if (modifier.startsWith("tax_") || modifier.startsWith("tax-")) {
        modifier = modifier.replace("tax_", "").replace("tax-", "");
        value = key;
        key = "tax";
        // if value matches value[valueNote], split into 2 variables
        // if (value.includes("[")) {
        //   [value, valueNote] = value.split(/\s*\[\s*/);
        //   valueNote = valueNote.replace("]", "").trim();
        // }
      } else if (modifier == "collate") {
        [key, ...value] = key.split(/\s*,\s*/);
        value = value.join(",");
        // key = "collate";
        // modifier = null;
      }
    }
  } else if (key.startsWith("tax_")) {
    modifier = key.replace("tax_", "");
    key = "tax";
    operator = undefined;
    value = value || "";
  } else if (!value) {
    if (!operator) {
      operator = "=";
    }
    modifier = "value";
  } else if (value && operator) {
    modifier = "value";
  }
  let chipObj = {
    key,
    operator: operator ? operator.trim() : null,
    value: value ? value.trim() : key == "tax" ? "" : null,
    valueNote: valueNote ? valueNote.trim() : null,
    modifier: modifier ? modifier.trim() : null,
  };
  if (key.match(/-/)) {
    chipObj.key = key.trim().replace(/-/g, "_");
  }
  if (chipObj?.value?.match(/^([\d.,\s]+)([kMGTPE])$/i)) {
    chipObj.value = `${parseValue(`${chipObj.value}`.toUpperCase())}`;
  }
  return {
    ...chipObj,
    processedChip: chipToString(chipObj),
  };
};

const QueryLabel = ({
  queryTitle,
  result,
  results,
  handleResultChange,
  groupColor,
}) => {
  const [open, setOpen] = useState(false);
  const buttonRef = React.useRef(null);

  const labelStyle = {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "2em",
    backgroundColor: groupColor,
    padding: "0 2px 0 6px",
    // fontWeight: "bold",
    fontVariantCaps: "small-caps",
    writingMode: "vertical-rl",
    textOrientation: "mixed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  };
  return (
    <>
      <div
        style={{
          ...labelStyle,
          left: 0,
          transform: "rotate(180deg)",
        }}
      >
        {queryTitle}
      </div>

      <div
        style={{
          ...labelStyle,
          right: 0,
          cursor: "pointer",
        }}
        onClick={() => setOpen(!open)}
        ref={buttonRef}
      >
        {result}
      </div>

      <Menu
        anchorEl={buttonRef.current}
        open={open}
        onClose={() => setOpen(false)}
      >
        {results.map((result) => (
          <MenuItem
            key={result}
            onClick={() => {
              setOpen(false);
              handleResultChange(result);
            }}
          >
            {result}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

const ChipSearch = ({
  value = "",
  inputQueries = {},
  placeholder = "Type to Search",
  showText = false,
  compact = false,
  backgroundColor = "#ffffff",
  lookupFunction = null,
  alignment = "center",
  result = "taxon",
  types = {},
  allTypes = types[result] || {},
  results = [],
  label = null,
  searchButton = null,
  handleValueChange = () => {},
  handleInputQueryChange = () => {},
}) => {
  const validation = typesToValidation({ types, searchIndex: result });
  const validKeys = validation.validKeys();
  const [showChips, setShowChips] = useState(!showText);
  const [currentInputQueries, setCurrentInputQueries] = useState(inputQueries);
  const removeDuplicates = (arr) => {
    let uniqueArr = [];
    let duplicates = new Set();
    // let keyOrder = ["tax"];
    let keyOrder = [];
    let seen = new Set(["AND"]);
    // let byKey = { tax: [] };
    let byKey = {};
    arr.forEach((item) => {
      if (!item.match(/^\s*AND\s*$/i)) {
        let { key, modifier, value, operator, processedChip } =
          extractKeyValue(item);
        let sortedValues = (value || "")
          .split(",")
          .map((v) => parseValue(v.trim()))
          .sort((a, b) => `${a}`.localeCompare(`${b}`))
          .join(",");
        let lcItem = `${modifier || "value".toLowerCase()}(${key.toLowerCase()})${operator || "=".toLowerCase()}${sortedValues.toLowerCase()}`;
        if (!seen.has(lcItem)) {
          let { key } = extractKeyValue(item);
          if (!byKey[key]) {
            byKey[key] = [];
            // if (key != "tax") {
            keyOrder.push(key);
            // }
          }
          byKey[key].push(processedChip);
          seen.add(lcItem);
        } else if (key == "tax") {
          duplicates.add(`${key}_${modifier}`);
        } else {
          duplicates.add(key);
        }
      }
    });
    for (let key of keyOrder) {
      for (let item of byKey[key]) {
        if (item !== "" && !uniqueArr.includes(item)) {
          if (uniqueArr.length > 0) {
            uniqueArr.push("AND");
          }
          uniqueArr.push(item);
        }
      }
    }
    return { uniqueArr, duplicates };
  };

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }
    const reordered = Array.from(chips);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    // Remove duplicates after reordering
    const { uniqueArr, duplicates } = removeDuplicates(reordered);
    setDuplicateKeys(duplicates);
    // Update the chips state with the unique array
    setChips(reordered);
    handleValueChange(uniqueArr.join(" "));
  };

  const setChipKey = (chip) => {
    const { key, modifier, operator, value } = extractKeyValue(chip);
    let chipKey;
    if (key == "tax" && modifier) {
      chipKey = `tax_${modifier}`;
    } else if (modifier == "collate") {
      chipKey = "collate";
    } else {
      if (modifier && modifier !== "value") {
        chipKey = `${modifier}(${key})`;
      } else {
        chipKey = key;
      }
      if (value !== "" && typeof value !== "undefined" && value !== null) {
        chipKey += `${operator || "="}`;
      }
    }
    return chipKey;
  };

  const conflictPairs = {
    tax_depth_name_tree: ["tax_name", "tax_tree", "tax_depth"],
    tax_depth_name_tree: ["tax_depth", "tax_name", "tax_tree"],
    tax_name: "tax_depth_name_tree",
    tax_tree: "tax_depth_name_tree",
    tax_depth: "tax_depth_name_tree",
  };

  const findConflictingChips = (chips) => {
    const conflicts = new Set();
    const chipMap = new Map();
    chips.forEach((chip) => {
      if (chip === "AND") {
        return; // Skip "AND" chips
      }
      const chipKey = setChipKey(chip);

      if (chipMap.has(chipKey)) {
        const existingChips = chipMap.get(chipKey);
        existingChips.push(chip);
        chipMap.set(chipKey, existingChips);
      } else if (chipKey) {
        chipMap.set(chipKey, [chip]);
      }
    });
    chipMap.forEach((chips, chipKey) => {
      if (chips.length > 1) {
        conflicts.add(chipKey);
      }
    });
    if (chipMap.has("tax_tree") && chipMap.has("tax_name")) {
      conflicts.add("tax_depth_name_tree");
    }
    if (chipMap.has("tax_name") && chipMap.has("tax_depth")) {
      conflicts.add("tax_depth_name_tree");
    }
    return conflicts;
  };

  let { uniqueArr, duplicates } = removeDuplicates(
    value ? value.split(/\s+AND\s+/i) : [],
  );
  const [inputValue, setInputValue] = useState(
    showText ? uniqueArr.join(" AND ") : "",
  );
  const [chips, setChips] = useState(showText ? [] : uniqueArr);
  const [open, setOpen] = useState(false);
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };
  const [conflictingChips, setConflictingChips] = useState(new Set());

  useEffect(() => {
    if (chips.length > 0) {
      setConflictingChips(findConflictingChips(chips));
    }
  }, [chips]);

  const RenderedChip = ({ chip, index, lookupFunction, ...props }) => {
    const { key, operator, value, valueNote, modifier } = extractKeyValue(chip);
    return (
      <KeyValueChip
        key={chip + index} // Use a unique key for each chip
        keyLabel={key}
        value={value}
        valueNote={valueNote}
        operator={operator}
        modifier={modifier}
        // palette={setPalette({ key, modifier })} // Set the palette based on the key
        onChange={handleChipChange}
        onDelete={() => handleDelete(chip, index)}
        style={{
          marginRight: index === chips.length - 1 ? "0" : "1em",
        }} // Add margin to chips
        chipIndex={index} // Pass the index to KeyValueChip
        lookupFunction={
          key === "tax" || key.endsWith("_id") ? lookupFunction : null
        }
        types={types}
        searchIndex={result}
        {...props} // Spread any additional props
      />
    );
  };

  const chipsToComponents = (chips) => {
    let chipGroups = {};
    let newChipsArr = chips.map((chip, index) => {
      if (chip === "AND" || chip === "") {
        return null; // Skip rendering "AND" as a Chip
      } else {
        // Check if the chip is in the conflict set
        let chipKey = setChipKey(chip);

        let isConflicting = conflictingChips.has(chipKey);
        if (conflictPairs[chipKey]) {
          isConflicting = conflictingChips.has(conflictPairs[chipKey]);
          chipKey = conflictPairs[chipKey]; // Use the first key for grouping
        }
        if (isConflicting) {
          if (!chipGroups[chipKey]) {
            chipGroups[chipKey] = { group: index, chips: [], indices: [] };
          }
          chipGroups[chipKey].chips.push(chip);
          chipGroups[chipKey].indices.push(index);
        } else {
          return (
            <Draggable
              key={chip + index}
              draggableId={chip + index}
              index={index}
            >
              {(provided) => (
                <span
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  style={{
                    ...provided.draggableProps.style,
                    display: "inline-flex",
                  }}
                >
                  <RenderedChip
                    chip={chip}
                    index={index}
                    lookupFunction={lookupFunction}
                  />
                </span>
              )}
            </Draggable>
          );
        }
      }
    });
    // Handle conflicting chips
    Object.entries(chipGroups).forEach(
      ([chipKey, { group, chips, indices }]) => {
        if (chips.length > 1) {
          const { key, modifier, value, valueNote, operator } = extractKeyValue(
            chips[0],
          );
          const multipleValuesAllowed = validation.allowMultipleValues({
            key,
            modifier,
          });
          const splitValuesAllowed = validation.allowSplitValues({
            key,
            modifier,
          });
          let message;
          let suggestion;
          let status = "info";
          let combinable = false;
          if (!multipleValuesAllowed) {
            message = "Multiple chips are not allowed";
            suggestion = "Delete one or more chips or change the operator";
            status = "error";
          } else if (key == "tax" || !splitValuesAllowed) {
            message = "Multiple chips are not allowed";
            suggestion =
              "Use comma separated values in a single chip for OR (click to apply)";
            combinable = true;
            status = "error";
          } else if (modifier == "collate") {
            message = "Multiple chips are not allowed";
            suggestion = "Delete one or more chips";
            status = "error";
          } else {
            message = "Values will be combined with AND";
            suggestion =
              "Use comma separated values in a single chip for OR (click to apply)";
            combinable = true;
          }
          const { color } = validation.validateKey({
            key,
          });
          const chipColor = getChipColor(
            status === "error" ? "orange" : color,
            "backgroundColor",
          );
          let handleIconClick = null;
          if (combinable) {
            handleIconClick = () => {
              const combinedValue = chips
                .map((c) => {
                  let { value: v } = extractKeyValue(c);
                  return v;
                })
                .join(",");

              setChips((prevChips) => {
                const newChips = [...prevChips];
                // Replace the first chip with the combined value
                newChips[indices[0]] = chipToString({
                  key,
                  value: combinedValue,
                  modifier: modifier || "value",
                  operator,
                  valueNote,
                });
                // Remove the rest of the chips in reverse order to avoid index shifting
                indices
                  .slice(1)
                  .sort((a, b) => b - a)
                  .forEach((index) => {
                    newChips.splice(index, 1);
                  });
                const { uniqueArr, duplicates } = removeDuplicates(newChips);
                setDuplicateKeys(duplicates);
                handleValueChange(uniqueArr.join(" "));
                return newChips;
              });
            };
          }
          let groupChips = chips.map((c, i) => {
            return (
              <RenderedChip
                key={`${chipKey}-${i}`}
                chip={c}
                isConflicting={true}
                group={group}
                index={indices[i]}
                palette={status === "error" ? "orange" : "blue"}
                forcePalette={status === "error"} // Force palette if multiple values are not allowed
                lookupFunction={lookupFunction}
              />
            );
          });
          newChipsArr.push(
            <ChipGroup
              key={chipKey}
              chipColor={chipColor}
              groupChips={groupChips}
              message={message}
              suggestion={suggestion}
              status={status}
              backgroundColor={backgroundColor}
              handleIconClick={handleIconClick}
            />,
          );
        }
      },
    );
    return newChipsArr;
  };

  const [duplicateKeys, setDuplicateKeys] = useState(duplicates);
  const [chipsArr, setChipsArr] = useState(chipsToComponents(chips));
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const handleKeyDown = (event, setInUse) => {
    if (event.key === "Enter") {
      event.preventDefault();
      setInUse && setInUse(false);
      parseInput(inputValue);
      setShowChips(true);
      setInputValue("");
    }
  };

  const parseInput = (input) => {
    // const regex =
    //   /\s+AND\s+|((?:\w+\()?[\w-]+\)*\s*(?:<=|>=|!=|=|<|>)\s*\w[\w\s,-]*|\w[\w-]+\s*\(\s*\w[\w\s\[\],-]+\s*\)|\w[\w-]+)/g;
    // const matches = input.match(regex);
    const terms = input.split(/\s+AND\s+/i); //.flatMap((part) =>
    if (terms && terms.length > 0) {
      setChips((prevChips) => {
        const { uniqueArr, duplicates } = removeDuplicates([
          ...prevChips,
          ...terms,
        ]);
        setDuplicateKeys(duplicates);
        return uniqueArr;
      });
    }
  };

  useEffect(() => {
    handleValueChange(chips.join(" "));
  }, [chips, handleValueChange]);

  const handleDelete = (chipToDelete, index) => {
    setChips((prevChips) => {
      let newChips = [...prevChips];
      newChips.splice(index, 1);
      const { uniqueArr, duplicates } = removeDuplicates(newChips);
      handleValueChange(uniqueArr.join(" "));
      setDuplicateKeys(duplicates);
      return uniqueArr;
    });
  };

  const handleChipChange = (updatedChip, index) => {
    setChips((prevChips) => {
      const newChips = [...prevChips];
      let { key, operator, value, modifier, palette } = updatedChip;
      if (Array.isArray(value)) {
        const extraChips = value.map((v) => {
          return chipToString({ key, operator, value: v, modifier, palette });
        });
        newChips.splice(index, 1, ...extraChips);
      } else {
        newChips[index] = chipToString(updatedChip);
      }
      const { uniqueArr, duplicates } = removeDuplicates(newChips);
      setDuplicateKeys(duplicates);
      handleValueChange(uniqueArr.join(" "));
      return newChips;
    });
  };

  const handleAddEmptyChip = (newChip = "key=value") => {
    setChips((prevChips) => {
      const { uniqueArr, duplicates } = removeDuplicates([
        ...prevChips,
        newChip,
      ]);
      setDuplicateKeys(duplicates);
      return uniqueArr;
    });
  };

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleMenuSelect = (chipType) => {
    handleAddEmptyChip(chipType);
    handleMenuClose();
  };

  const updateChipsArr = (chips) => {
    setChipsArr(chipsToComponents(chips));
  };

  const [inUse, setInUse] = useState(false);

  useEffect(() => {
    updateChipsArr(chips);
  }, [chips, conflictingChips]);

  const chipsToString = (chips) => {
    return chips.filter((chip) => chip !== "AND").join(" AND ");
  };

  // render a snackbar if there are duplicates
  useEffect(() => {
    if (duplicateKeys.size > 0) {
      setOpen(true);
    }
  }, [duplicateKeys]);

  let startAdornment;
  if (
    (chipsArr.length > 0 && showChips) ||
    chipsArr.filter((chip) => chip !== "AND" && chip !== "").length > 0
  ) {
    startAdornment = (
      <InputAdornment position="start">
        <Tooltip title="Click to show search term as text">
          <IconButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowChips(false);
              setInputValue(chipsToString(chips));
              setChips([]);
            }}
            edge="start"
            sx={{ zIndex: 500 }}
          >
            <TextFieldsIcon sx={{ fontSize: "1.5em" }} />
          </IconButton>
        </Tooltip>
      </InputAdornment>
    );
  } else {
    startAdornment = (
      <InputAdornment position="start">
        <Tooltip title="Click to show search term as fields">
          <IconButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleKeyDown(
                { key: "Enter", preventDefault: () => {} },
                setInUse,
              );
            }}
            edge="start"
          >
            <SpaceDashboardIcon sx={{ fontSize: "1.5em" }} />
          </IconButton>
        </Tooltip>
      </InputAdornment>
    );
  }
  const justifyContent =
    alignment === "left"
      ? "flex-start"
      : alignment === "right"
        ? "flex-end"
        : "center";

  const addField = (
    <AddField
      handleMenuOpen={handleMenuOpen}
      menuAnchorEl={menuAnchorEl}
      handleMenuClose={handleMenuClose}
      validKeys={validKeys}
      handleMenuSelect={handleMenuSelect}
      fontSize={"1.5em"}
    />
  );

  const inputQueryList = React.useMemo(() => {
    if (chips && chips.length > 0) {
      return chips
        .map((chip) => {
          return chip.match(/\bquery[A-Z]\b/g);
        })
        .filter(Boolean)
        .flat();
    }
    if (inputValue && inputValue.length > 0) {
      return inputValue
        .split(/\s+AND\s+/i)
        .map((chip) => {
          return chip.match(/\bquery[A-Z]\b/g);
        })
        .filter(Boolean)
        .flat();
    }
    return [];
  }, [chips, inputValue]);

  let newInputQueries = {};
  const inputQueryComponents = inputQueryList.map((key) => {
    const {
      result: searchIndex = result,
      query = "",
      fields = [],
    } = currentInputQueries[key] || {};
    if (!currentInputQueries[key]) {
      newInputQueries[key] = {
        result: searchIndex,
        query,
        fields,
      };
    }

    const groupColor = "#80808033";
    return (
      <Box
        key={key}
        sx={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          marginBottom: 1,
          border: `2px solid ${groupColor}`,
          padding: "0 2.5em 0.5em calc(2em + 12px)",
          borderRadius: "8px",
          maxWidth: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <ChipSearch
          key={key}
          value={query}
          result={searchIndex}
          results={results}
          types={allTypes[searchIndex] || types}
          inputQueries={{}}
          lookupFunction={lookupFunction}
          compact={compact}
          inline={true}
          label={
            <QueryLabel
              queryTitle={key}
              result={searchIndex}
              results={results}
              handleResultChange={(result) => {
                const updatedQueries = {
                  ...currentInputQueries,
                  [key]: {
                    ...currentInputQueries[key],
                    result,
                  },
                };
                setCurrentInputQueries(updatedQueries);
                handleInputQueryChange(updatedQueries);
              }}
              groupColor={groupColor}
            />
          }
          handleValueChange={(query) =>
            handleInputQueryChange({
              [key]: { query, result: searchIndex, fields },
            })
          }
        />
      </Box>
    );
  });

  // Only update state if there are new queries, and do it in an effect
  useEffect(() => {
    if (Object.keys(newInputQueries).length > 0) {
      setCurrentInputQueries((prev) => ({ ...prev, ...newInputQueries }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputQueryList.join(",")]);

  return (
    <Box
      sx={{
        display: "inline-flex",
        flexDirection: "column",
        justifyContent,
        alignItems: "center", // Align items vertically in the center
        gap: 1, // Add spacing between Box and TextField
        flexWrap: "wrap", // Allow content to wrap if it overflows
        marginTop: "8px",
      }}
    >
      {inputQueryComponents.length > 0 && (
        <Box
          sx={{
            display: "inline-flex",
            flexDirection: "column",
            justifyContent,
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {inputQueryComponents}
        </Box>
      )}
      <>
        {" "}
        <Box
          sx={{
            maxWidth: "100%",
            display: "inline-flex",
            flexDirection: "row",
            justifyContent,
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {label}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="chips-droppable" direction="horizontal">
              {(provided) => (
                <Box
                  sx={{
                    maxWidth: "100%",
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent,
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {chipsArr}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>
          {addField}
          {!compact && (
            <TextInput
              inputValue={inputValue}
              inUse={inUse}
              setInUse={setInUse}
              setInputValue={setInputValue}
              handleKeyDown={handleKeyDown}
              placeholder={placeholder}
              handleMenuOpen={handleMenuOpen}
              menuAnchorEl={menuAnchorEl}
              handleMenuClose={handleMenuClose}
              validKeys={validKeys}
              handleMenuSelect={handleMenuSelect}
              startAdornment={startAdornment}
              handleInputValueChange={(inputValue) => {
                const terms = inputValue.split(/\s+AND\s+/i);
                if (terms && terms.length > 0) {
                  const { uniqueArr, duplicates } = removeDuplicates([
                    ...chips,
                    ...terms,
                  ]);
                  handleValueChange(uniqueArr.join(" "));
                }
              }}
              multiline={true}
              rows={2}
            />
          )}
          {searchButton}
        </Box>
      </>
      {/* {!compact && searchButton} */}
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert
          onClose={handleClose}
          severity="info"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Removed duplicate terms for{" "}
          {Array.from(duplicateKeys).map((key, index, array) => (
            <React.Fragment key={key}>
              <b>{key}</b>
              {index < array.length - 2
                ? ", "
                : index === array.length - 2
                  ? " and "
                  : ""}
            </React.Fragment>
          ))}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChipSearch;

const TextInput = ({
  inputValue,
  inUse,
  setInUse,
  setInputValue,
  handleInputValueChange,
  handleKeyDown,
  placeholder,
  startAdornment,
}) => {
  // const [inUse, setInUse] = useState(inputValue.length > 0);
  const inputRef = React.useRef(null);
  const multiline = true;
  const maxRows = 8;
  const minRows = inputValue.length > 30 ? 2 : 1;

  return (
    <TextField
      variant="outlined"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onFocus={() => setInUse(true)}
      onKeyDown={(e) => handleKeyDown(e, setInUse)}
      onBlur={(e) => {
        // Don't update state if the input adornment (icon button) was clicked
        const related = e.relatedTarget;
        if (
          related &&
          related.closest &&
          related.closest(".MuiInputAdornment-root")
        ) {
          return;
        }
        if (inputValue.length === 0) {
          setInUse(false);
        }
        handleInputValueChange(inputValue);
      }}
      placeholder={placeholder}
      multiline={inUse ? multiline : false}
      maxRows={inUse ? maxRows : 1}
      minRows={inUse ? minRows : 1}
      inputRef={inputRef}
      slotProps={{
        input: {
          startAdornment: inUse ? startAdornment : null,
          style: {
            resize: inUse && multiline ? "both" : "none",
            overflow: "auto",
          },
          autoFocus: inUse, // Focus the input when inUse is true
        },
      }}
      sx={{
        flexGrow: 1,
        margin: "0 0.5em 0 -0.5em",
        minWidth: inUse ? "450px" : "200px",
        maxWidth: inUse ? "600px" : "200px",
        "& .MuiInputBase-root": {
          alignItems: multiline ? "flex-start" : "center",
        },
        "& .MuiInputAdornment-root": {
          marginTop: "-0.25em",
          marginBottom: "-0.25em",
        },
        "& textarea": {
          boxSizing: "border-box",
          width: "100%",
        },
      }}
    />
  );
};

const AddField = ({
  handleMenuOpen,
  menuAnchorEl,
  handleMenuClose,
  validKeys,
  handleMenuSelect,
  fontSize = "1em", // Default font size
}) => {
  return (
    <>
      <IconButton onClick={handleMenuOpen} edge="start">
        <Tooltip title="Click to add a new search field">
          <AddCircleOutlineIcon sx={{ fontSize }} />
        </Tooltip>
      </IconButton>
      <FieldNameMenu
        menuAnchorEl={menuAnchorEl}
        handleMenuClose={handleMenuClose}
        validKeys={validKeys}
        handleMenuSelect={handleMenuSelect}
      />
    </>
  );
};
const ChipGroup = ({
  chipKey,
  chipColor,
  groupChips,
  status,
  message,
  suggestion,
  backgroundColor,
  handleIconClick,
}) => {
  const [hovered, setHovered] = React.useState(false);

  // Use a ref to track mouse and focus events more robustly
  const groupRef = React.useRef(null);

  // Handle both mouse and focus events for better robustness
  const handlePointerEnter = () => setHovered(true);
  const handlePointerLeave = (e) => {
    // Only set hovered to false if the pointer actually leaves the group
    if (groupRef.current && !groupRef.current.contains(e.relatedTarget)) {
      setHovered(false);
    }
  };
  const handleFocus = () => setHovered(true);
  const handleBlur = (e) => {
    // Only set hovered to false if focus moves outside the group
    if (groupRef.current && !groupRef.current.contains(e.relatedTarget)) {
      setHovered(false);
    }
  };

  let topIcon;
  let baseIcon;
  if (message) {
    if (status == "error") {
      topIcon = (
        <Tooltip
          title={
            <div>
              <div>{message}</div>
              <i>{suggestion}</i>
            </div>
          }
          arrow
          placement="bottom"
        >
          <span>
            <ErrorIcon
              sx={{
                fontSize: "1.2rem",
                margin: "0 0.125rem 0 0",
                verticalAlign: "middle",
              }}
            />
            {message}
          </span>
        </Tooltip>
      );
    }
    if (handleIconClick) {
      const joinIcon = hovered ? (
        <JoinFullRoundedIcon
          sx={{
            fontSize: "1.5rem",
            margin: "-0.2rem 0",
          }}
        />
      ) : (
        <JoinInnerRoundedIcon
          sx={{
            fontSize: "1.5rem",
            margin: "-0.2rem 0",
          }}
        />
      );
      baseIcon = (
        <Tooltip
          title={
            <div>
              <div>{message}</div>
              <i>{suggestion}</i>
            </div>
          }
          arrow
          placement="bottom"
        >
          {joinIcon}
        </Tooltip>
      );
    }

    if (topIcon) {
      topIcon = (
        <div
          style={{
            position: "absolute",
            width: "calc(100% - 3em)",
            left: "1.5em",
            top: "-0.75em",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              color: chipColor,
              textAlign: "center",
              maxWidth: "100%",
              padding: "0 0.5rem",
              fontSize: "0.75rem",
              backgroundColor,
              maxHeight: "1.5rem",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            // ref={groupRef}
            // onMouseEnter={handlePointerEnter}
            // onMouseLeave={handlePointerLeave}
            // onFocus={handleFocus}
            // onBlur={handleBlur}
            // onClick={handleIconClick}
          >
            {topIcon}
          </div>
        </div>
      );
    }
    if (baseIcon) {
      baseIcon = (
        <div
          style={{
            position: "absolute",
            width: "calc(100% - 3em)",
            left: "1.5em",
            top: "calc(100% - 0.4em)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              color: chipColor,
              textAlign: "center",
              maxWidth: "100%",
              padding: "0 0.5rem",
              fontSize: "0.75rem",
              backgroundColor,
              maxHeight: "1.5rem",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            ref={groupRef}
            onMouseEnter={handlePointerEnter}
            onMouseLeave={handlePointerLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onClick={handleIconClick}
          >
            {baseIcon}
          </div>
        </div>
      );
    }
  }

  return (
    <div
      key={chipKey}
      tabIndex={0}
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        alignItems: "center",
        maxWidth: "100%",
        gap: "0.5em",
        border: `0.2em solid ${chipColor}`,
        borderRadius: "1.5em",
        padding: "0.5em",
        margin: "0.125em 0",
        position: "relative",
        outline: hovered ? `2px solid ${chipColor}` : "none",
        width: "fit-content",
        minWidth: 0,
      }}
    >
      {/* Render the group chips inside the colored border */}
      {groupChips}
      {topIcon}
      {baseIcon}
    </div>
  );
};
