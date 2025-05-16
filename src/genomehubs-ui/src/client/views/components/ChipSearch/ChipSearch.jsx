import {
  Alert,
  Box,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Snackbar,
  TextField,
} from "@mui/material";
import KeyValueChip, { parseValue, typesToValidation } from "../KeyValueChip";
import React, { useEffect, useState } from "react";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline"; // Import an add icon

const allowedSymbols = ["=", "!=", ">=", "<=", "<", ">"];
const allowedKeywordSymbols = allowedSymbols.slice(0, 2);
const allowedModifiers = [
  "count",
  "length",
  "max",
  "mean",
  "median",
  "min",
  "sum",
  "value",
];
const allowedKeys = {
  assembly_span: {
    operators: allowedSymbols,
    modifiers: allowedModifiers,
    type: "number",
  },
  assembly_level: {
    operators: allowedSymbols,
    modifiers: "value",
    type: "string",
  },
  tax: {
    operators: [],
    modifiers: ["name", "tree", "eq", "lineage", "rank", "level"],
    type: "string",
  },
  collate: {
    operators: [],
    modifiers: ["collate"],
    type: "string",
  },
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
  initialChips = [],
  initialInput = "",
  placeholder = "Enter key=value, function(variable), or AND",
}) => {
  const validation = typesToValidation();
  const validKeys = validation.validKeys();
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
        console.log("lcItem", lcItem);
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

  const [inputValue, setInputValue] = useState(initialInput);
  let { uniqueArr, duplicates } = removeDuplicates(initialChips);
  const [chips, setChips] = useState(uniqueArr);
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

  const handleDelete = (chipToDelete) => {
    setChips((prevChips) => prevChips.filter((chip) => chip !== chipToDelete));
  };

  const handleChipChange = (updatedChip) => {
    setChips((prevChips) =>
      prevChips.map((chip) =>
        chip === `${updatedChip.key}=${updatedChip.value}`
          ? `${updatedChip.key}${updatedChip.operator}${updatedChip.value}`
          : chip,
      ),
    );
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
            onDelete={() => handleDelete(chip)}
            style={{ marginRight: index === chips.length - 1 ? "-1em" : "1em" }} // Add margin to chips
          />
        );
      }
    });
    setChipsArr(newChipsArr);
  };

  useEffect(() => {
    updateChipsArr(chips);
  }, [chips]);

  // render a snackbar if there are duplicates
  useEffect(() => {
    if (duplicateKeys.size > 0) {
      console.log("Duplicate keys found:", duplicateKeys);
      setOpen(true);
    }
  }, [duplicateKeys]);

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
          }}
          slotProps={{
            input: {
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <IconButton onClick={handleMenuOpen} edge="start">
                      <AddCircleOutlineIcon />
                    </IconButton>
                  </InputAdornment>
                  <Menu
                    anchorEl={menuAnchorEl}
                    open={Boolean(menuAnchorEl)}
                    onClose={handleMenuClose}
                  >
                    {[...validKeys.keysByGroup.primary].map((key) => {
                      let value = key;
                      if (key == "collate") {
                        value = "collate(sequence_id,name)";
                      } else if (key.startsWith("tax_")) {
                        value = `${key}()`;
                      }
                      return (
                        <MenuItem
                          key={key}
                          onClick={() => handleMenuSelect(value)}
                        >
                          {key}
                        </MenuItem>
                      );
                    })}
                  </Menu>
                </>
              ),
            },
          }}
        />
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
      ,
    </Box>
  );
};

export default ChipSearch;
