import {
  Alert,
  Box,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
} from "@mui/material";
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
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import Tooltip from "../Tooltip";
import { getChipColor } from "../KeyValueChip/functions/chipPalettes";

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
  } else if (!value) {
    operator = "=";
    modifier = "value";
  } else if (value && operator) {
    modifier = "value";
  }
  return {
    key: key.trim().replace(/-/g, "_"),
    operator: operator ? operator.trim() : null,
    value: value ? value.trim() : key == "tax" ? "" : null,
    valueNote: valueNote ? valueNote.trim() : null,
    modifier: modifier ? modifier.trim() : null,
  };
};

const ChipSearch = ({
  value = "",
  placeholder = "Enter key=value, function(variable), or AND",
  showText = false,
  compact = false,
  backgroundColor = "#ffffff",
  lookupFunction = null,
  alignment = "center", // Default alignment
  inline = true, // Default to false for column layout
  types = {},
  searchButton = null,
  handleValueChange = () => {},
}) => {
  const validation = typesToValidation(types);
  const validKeys = validation.validKeys();
  const [showChips, setShowChips] = useState(!showText);
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
        let { key, modifier, value, operator } = extractKeyValue(item);
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
          byKey[key].push(item);
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
        if (!uniqueArr.includes(item)) {
          if (uniqueArr.length > 0) {
            uniqueArr.push("AND");
          }
          uniqueArr.push(item);
        }
      }
    }

    return { uniqueArr, duplicates };
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
  const [duplicateKeys, setDuplicateKeys] = useState(duplicates);
  const [chipsArr, setChipsArr] = useState(chips);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [conflictingChips, setConflictingChips] = useState(new Set());

  useEffect(() => {
    if (chips.length > 0) {
      setConflictingChips(findConflictingChips(chips));
    }
  }, [chips]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
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
        handleValueChange(uniqueArr.join(" "));
        return uniqueArr;
      });
    }
  };

  const handleDelete = (chipToDelete, index) => {
    setChips((prevChips) => {
      let newChips = [...prevChips];
      newChips.splice(index, 1);
      return newChips;
    });
  };

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
      if (value !== "" && typeof value !== "undefined" && value !== null) {
        chipString += `${operator}`;
      }
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
      handleValueChange(newChips.join(" "));
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
          marginRight: index === chips.length - 1 ? "-1em" : "1em",
        }} // Add margin to chips
        chipIndex={index} // Pass the index to KeyValueChip
        lookupFunction={key === "tax" ? lookupFunction : null}
        types={types}
        {...props} // Spread any additional props
      />
    );
  };

  const updateChipsArr = (chips) => {
    let chipGroups = {};
    let newChipsArr = chips.map((chip, index) => {
      if (chip === "AND" || chip === "") {
        return null; // Skip rendering "AND" as a Chip
      } else {
        // Check if the chip is in the conflict set
        const chipKey = setChipKey(chip);

        const isConflicting = conflictingChips.has(chipKey);
        if (isConflicting) {
          if (!chipGroups[chipKey]) {
            chipGroups[chipKey] = { group: index, chips: [], indices: [] };
          }
          chipGroups[chipKey].chips.push(chip);
          chipGroups[chipKey].indices.push(index);
        } else {
          return (
            <RenderedChip
              key={chip + index}
              chip={chip}
              index={index}
              lookupFunction={lookupFunction}
            />
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
          let message;
          let suggestion;
          let status = "info";
          let combinable = false;
          if (!multipleValuesAllowed) {
            message = "Multiple chips are not allowed";
            suggestion = "Delete one or more chips or change the operator";
            status = "error";
          } else if (key == "tax") {
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
    setChipsArr(newChipsArr);
  };

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
            onClick={() => {
              setShowChips(false);
              setInputValue(chipsToString(chips));
              setChips([]);
            }}
            edge="start"
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
            onClick={() => {
              handleKeyDown({ key: "Enter", preventDefault: () => {} });
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
  return (
    <Box
      sx={{
        display: "inline-flex",
        flexDirection: inline ? "row" : "column",
        justifyContent,
        alignItems: "center", // Align items vertically in the center
        gap: 1, // Add spacing between Box and TextField
        flexWrap: "wrap", // Allow content to wrap if it overflows
      }}
    >
      <>
        <Box
          sx={{
            width: "100%",
            maxWidth: "100%",
            display: "inline-flex",
            flexDirection: "row",
            justifyContent,
            alignItems: "center", // Align items vertically in the center
            gap: 1, // Add spacing between Box and TextField
            flexWrap: "wrap", // Allow content to wrap if it overflows
          }}
        >
          {chipsArr}
          {addField}
          {compact && searchButton}
        </Box>
        <Box
          sx={{
            display: "inline-flex",
            flexDirection: "row",
            justifyContent,
            minWidth: compact ? "10px" : "300px",
            maxWidth: "900px",
            width: "100%",

            alignItems: "center", // Align items vertically in the center
            gap: 1, // Add spacing between Box and TextField
            flexWrap: "wrap", // Allow content to wrap if it overflows
          }}
        >
          {!compact && (
            <TextInput
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleKeyDown={handleKeyDown}
              placeholder={placeholder}
              handleMenuOpen={handleMenuOpen}
              menuAnchorEl={menuAnchorEl}
              handleMenuClose={handleMenuClose}
              validKeys={validKeys}
              handleMenuSelect={handleMenuSelect}
              startAdornment={startAdornment}
              multiline={true}
              rows={2}
            />
          )}
        </Box>
      </>
      {!compact && searchButton}
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
  setInputValue,
  handleKeyDown,
  placeholder,
  startAdornment,
}) => {
  const multiline = true;
  const maxRows = 8;
  const minRows = inputValue.length > 30 ? 2 : 1;
  return (
    <TextField
      variant="outlined"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      multiline={multiline}
      maxRows={maxRows}
      minRows={minRows}
      slotProps={{
        input: {
          startAdornment,
          style: {
            resize: "both",
            overflow: "auto",
          },
        },
      }}
      sx={{
        flexGrow: 1,
        minWidth: "200px",
        maxWidth: "900px",
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
