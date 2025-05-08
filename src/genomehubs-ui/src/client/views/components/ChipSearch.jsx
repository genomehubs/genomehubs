import {
  Box,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  TextField,
} from "@mui/material";
import React, { useEffect, useState } from "react";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline"; // Import an add icon
import KeyValueChip from "./KeyValueChip";

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
    symbols: allowedSymbols,
    modifiers: allowedModifiers,
    type: "number",
  },
  assembly_level: {
    symbols: allowedSymbols,
    modifiers: "value",
    type: "string",
  },
  tax: {
    symbols: [],
    modifiers: ["name", "tree", "eq", "lineage", "rank", "level"],
    type: "string",
  },
  collate: {
    symbols: [],
    modifiers: ["collate"],
    type: "string",
  },
};

const extractKeyValue = (chip) => {
  let modifier;
  let valueNote;
  let [key, symbol, value] = chip.split(/\s*(!=|>=|<=|<|>|=)\s*/);
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
    symbol = "=";
    modifier = "value";
  } else if (value && symbol) {
    modifier = "value";
  }
  return {
    key: key.trim().replace("-", "_"),
    symbol: symbol ? symbol.trim() : null,
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
  const removeDuplicates = (arr) => {
    const symbolOrder = [">", ">=", "=", "<=", "<", "!="];
    let uniqueArr = [];
    let keyOrder = ["tax"];
    let seen = new Set(["AND"]);
    let byKey = { tax: [] };
    arr.forEach((item) => {
      if (!seen.has(item)) {
        let { key } = extractKeyValue(item);
        if (!byKey[key]) {
          byKey[key] = [];
          if (key != "tax") {
            keyOrder.push(key);
          }
        }
        byKey[key].push(item);
        //uniqueArr.push(item);
        seen.add(item);
      }
    });
    for (let key of keyOrder) {
      let items = byKey[key];
      if (items.length > 1) {
        // Sort by symbol order
        items.sort((a, b) => {
          let symbolA = extractKeyValue(a).symbol;
          let symbolB = extractKeyValue(b).symbol;
          return symbolOrder.indexOf(symbolA) - symbolOrder.indexOf(symbolB);
        });
      }
      for (let item of items) {
        if (!uniqueArr.includes(item)) {
          if (uniqueArr.length > 0) {
            uniqueArr.push("AND");
          }
          uniqueArr.push(item);
        }
      }
    }

    return uniqueArr;
  };

  const setPalette = ({ key, modifier }) => {
    if (modifier == "collate") {
      return "green";
    }
    switch (key) {
      case "tax":
        return "purple";
      case "collate":
        return "green";
      default:
        return "blue";
    }
  };

  const [inputValue, setInputValue] = useState(initialInput);
  const [chips, setChips] = useState(removeDuplicates(initialChips));
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
      setChips((prevChips) => removeDuplicates([...prevChips, ...terms]));
    }
  };

  const handleDelete = (chipToDelete) => {
    setChips((prevChips) => prevChips.filter((chip) => chip !== chipToDelete));
  };

  const handleChipChange = (updatedChip) => {
    setChips((prevChips) =>
      prevChips.map((chip) =>
        chip === `${updatedChip.key}=${updatedChip.value}`
          ? `${updatedChip.key}${updatedChip.symbol}${updatedChip.value}`
          : chip,
      ),
    );
  };

  const handleAddEmptyChip = (newChip = "key=value") => {
    setChips((prevChips) => removeDuplicates([...prevChips, newChip])); // Add a default empty chip
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
        // Extract key, symbol, and value from the chip
        const { key, symbol, value, valueNote, modifier } =
          extractKeyValue(chip);
        return (
          <KeyValueChip
            key={chip + index} // Use a unique key for each chip
            keyLabel={key}
            value={value}
            valueNote={valueNote}
            symbol={symbol}
            modifier={modifier}
            allowedKeys={allowedKeys}
            palette={setPalette({ key, modifier })} // Set the palette based on the key
            onChange={handleChipChange}
            onDelete={() => handleDelete(chip)}
            style={{ marginRight: "1em" }} // Add margin to chips
          />
        );
      }
    });
    setChipsArr(newChipsArr);
  };

  useEffect(() => {
    updateChipsArr(chips);
  }, [chips]);

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
                    {Object.entries(allowedKeys).flatMap(([chipType, obj]) => {
                      let chipTypes = [];
                      if (chipType == "collate") {
                        chipTypes.push({
                          key: "collate",
                          value: "collate(sequence_id,name)",
                        });
                      } else if (chipType == "tax") {
                        chipTypes.push({
                          key: "tax_tree",
                          value: "tax_tree()",
                        });
                        chipTypes.push({
                          key: "tax_name",
                          value: "tax_name()",
                        });
                        chipTypes.push({
                          key: "tax_rank",
                          value: "tax_rank()",
                        });
                      } else {
                        chipTypes.push({ key: chipType, value: chipType });
                      }
                      return chipTypes.map(({ key, value }) => {
                        return (
                          <MenuItem
                            key={key}
                            onClick={() => handleMenuSelect(value)}
                          >
                            {key}
                          </MenuItem>
                        );
                      });
                    })}
                  </Menu>
                </>
              ),
            },
          }}
        />
      </>
    </Box>
  );
};

export default ChipSearch;
