import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import React, { useEffect, useState } from "react";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline"; // Import an add icon
import KeyValueChip from "./KeyValueChip";

const extractKeyValue = (chip) => {
  let modifier;
  let [key, symbol, value] = chip.split(/\s*(!=|>=|<=|<|>|=)\s*/);
  if (key.includes("(")) {
    if (value) {
      [modifier, key] = key.split(/\s*\(\s*/);
      key = key.replace(")", "").trim();
    } else {
      // Extract the function and variable
      [modifier, key] = key.split(/\s*\(\s*/);
      key = key.replace(")", "").trim();
      if (modifier.startsWith("tax_")) {
        modifier = modifier.replace("tax_", "");
        value = key;
        key = "tax";
      }
      if (modifier == "collate") {
        value = key;
        key = "collate";
        modifier = null;
      }
    }
  }
  return {
    key: key.trim(),
    symbol: symbol ? symbol.trim() : null,
    value: value ? value.trim() : null,
    modifier: modifier ? modifier.trim() : null,
  };
};

const ChipSearch = ({
  initialChips = [],
  initialInput = "",
  placeholder = "Enter key=value, function(variable), or AND",
}) => {
  const removeDuplicates = (arr) => {
    let uniqueArr = [];
    let keyOrder = [];
    let seen = new Set(["AND"]);
    let byKey = {};
    arr.forEach((item) => {
      if (!seen.has(item)) {
        let { key } = extractKeyValue(item);
        if (!byKey[key]) {
          byKey[key] = [];
          keyOrder.push(key);
        }
        byKey[key].push(item);
        //uniqueArr.push(item);
        seen.add(item);
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

    return uniqueArr;
  };

  const setPalette = (key) => {
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

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      parseInput(inputValue);
      setInputValue("");
    }
  };

  const parseInput = (input) => {
    const regex =
      /((?:\w+\()?\w+\)*\s*(?:<=|>=|!=|=|<|>)\s*\w+|\w+\s*\(\s*[\w\[\],]+\s*\)|AND)/g;
    const matches = input.match(regex);
    if (matches) {
      setChips((prevChips) => removeDuplicates([...prevChips, ...matches]));
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

  const handleAddEmptyChip = () => {
    setChips((prevChips) => removeDuplicates([...prevChips, "key=value"])); // Add a default empty chip
  };

  const updateChipsArr = (chips) => {
    let newChipsArr = chips.map((chip, index) => {
      if (chip === "AND") {
        return null; // Skip rendering "AND" as a Chip
      } else {
        // Extract key, symbol, and value from the chip
        const { key, symbol, value, modifier } = extractKeyValue(chip);
        return (
          <KeyValueChip
            key={chip + index} // Use a unique key for each chip
            keyLabel={key}
            value={value}
            symbol={symbol}
            modifier={modifier}
            palette={setPalette(key)}
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
                <InputAdornment position="start">
                  <IconButton onClick={handleAddEmptyChip} edge="start">
                    <AddCircleOutlineIcon />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </>
    </Box>
  );
};

export default ChipSearch;
