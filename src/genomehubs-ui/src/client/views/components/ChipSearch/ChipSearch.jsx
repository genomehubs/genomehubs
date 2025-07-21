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
import KeyboardArrowLeftIcon from "@mui/icons-material/SpaceDashboard";
import KeyboardArrowRightIcon from "@mui/icons-material/TextFields";
import Tooltip from "../Tooltip";

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
        if (value.includes("[")) {
          [value, valueNote] = value.split(/\s*\[\s*/);
          valueNote = valueNote.replace("]", "").trim();
        }
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
}) => {
  const validation = typesToValidation();
  const validKeys = validation.validKeys();
  const [showChips, setShowChips] = useState(!showText);
  const removeDuplicates = (arr) => {
    let uniqueArr = [];
    let duplicates = new Set();
    let keyOrder = ["tax"];
    let seen = new Set(["AND"]);
    let byKey = { tax: [] };
    arr.forEach((item) => {
      if (!item.match(/^\s*AND\s*$/i)) {
        let { key, modifier, value, operator } = extractKeyValue(item);
        let sortedValues = (value || "")
          .split(",")
          .map((v) => parseValue(v.trim()))
          .sort((a, b) => a.localeCompare(b))
          .join(",");
        let lcItem = `${modifier || "value".toLowerCase()}(${key.toLowerCase()})${operator || "=".toLowerCase()}${sortedValues.toLowerCase()}`;
        if (!seen.has(lcItem)) {
          let { key } = extractKeyValue(item);
          if (!byKey[key]) {
            byKey[key] = [];
            if (key != "tax") {
              keyOrder.push(key);
            }
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
      prevChips[index] = chipToString(updatedChip);
      return [...prevChips];
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
    let newChipsArr = chips.map((chip, index) => {
      if (chip === "AND") {
        return null; // Skip rendering "AND" as a Chip
      } else {
        // Extract key, operator, and value from the chip
        const { key, operator, value, valueNote, modifier } =
          extractKeyValue(chip);
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
            style={{ marginRight: index === chips.length - 1 ? "-1em" : "1em" }} // Add margin to chips
            chipIndex={index} // Pass the index to KeyValueChip
          />
        );
      }
    });
    setChipsArr(newChipsArr);
  };

  useEffect(() => {
    updateChipsArr(chips);
  }, [chips]);

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
  if (chipsArr.length > 0 && showChips) {
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
            <KeyboardArrowRightIcon sx={{ fontSize: "1.5em" }} />
          </IconButton>
        </Tooltip>
      </InputAdornment>
    );
  } else if (!chipsArr.length && inputValue && inputValue.length > 0) {
    startAdornment = (
      <InputAdornment position="start">
        <Tooltip title="Click to show search term as fields">
          <IconButton
            onClick={() => {
              handleKeyDown({ key: "Enter", preventDefault: () => {} });
            }}
            edge="start"
          >
            <KeyboardArrowLeftIcon sx={{ fontSize: "1.5em" }} />
          </IconButton>
        </Tooltip>
      </InputAdornment>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        display: "inline-flex",
        alignItems: "center", // Align items vertically in the center
        gap: 1, // Add spacing between Box and TextField
        flexWrap: "wrap", // Allow content to wrap if it overflows
      }}
    >
      <>
        {chipsArr}

        <AddField
          handleMenuOpen={handleMenuOpen}
          menuAnchorEl={menuAnchorEl}
          handleMenuClose={handleMenuClose}
          validKeys={validKeys}
          handleMenuSelect={handleMenuSelect}
          fontSize={"1.5em"}
        />
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
      </>
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
  return (
    <TextField
      variant="outlined"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      sx={{
        flexGrow: 1,
        minWidth: "300px",
        maxWidth: "900px",
        "& .MuiSvgIcon-root": {
          fontSize: "1em",
        },
      }}
      slotProps={{
        input: {
          startAdornment,
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
