import { Box, Chip, TextField } from "@mui/material";
import React, { useState } from "react";

import KeyValueChip from "./KeyValueChip";

const ChipSearch = ({
  initialChips = [],
  initialInput = "",
  placeholder = "Enter key=value, function(variable), or AND",
}) => {
  const [inputValue, setInputValue] = useState(initialInput);
  const [chips, setChips] = useState(initialChips);
  const boxRef = React.useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      parseInput(inputValue);
      setInputValue("");
    }
  };

  const parseInput = (input) => {
    const regex = /(\w+\s*=\s*\w+|\w+\s*\(\s*\w+\s*\)|AND)/g;
    const matches = input.match(regex);
    if (matches) {
      setChips((prevChips) => [...prevChips, ...matches]);
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

  let chipsArr = chips.map((chip, index) => {
    if (chip === "AND") {
      return null; // Skip rendering "AND" as a Chip
    } else if (chip.includes("=")) {
      // Render key=value chips as KeyValueChip
      const [key, value] = chip.split("=");
      return (
        <KeyValueChip
          key={index}
          keyLabel={key}
          value={value}
          symbol="="
          onChange={handleChipChange}
          onDelete={() => handleDelete(chip)}
          style={{ marginRight: "1em" }} // Add margin to chips
        />
      );
    } else if (chip.includes("(") && chip.includes(")")) {
      // Render function(variable) chips as KeyValueChip
      let [func, variable] = chip
        .replace(")", "")
        .split("(")
        .map((str) => str.trim());
      let modifier = "";
      if (func.startsWith("tax_")) {
        modifier = func.replace("tax_", "");
        func = "tax";
      }

      return (
        <KeyValueChip
          key={index}
          keyLabel={func}
          value={variable}
          modifier={modifier}
          symbol={null}
          palette="purple"
          onChange={handleChipChange}
          onDelete={() => handleDelete(chip)}
          style={{ marginRight: "1em" }}
        />
      );
    }
    return null;
  });

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
            // flexBasis: "100%", // Ensure TextField takes full width on wrap
          }}
        />
      </>
    </Box>
  );
};

export default ChipSearch;
