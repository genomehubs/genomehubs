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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        label="Chip Search"
        variant="outlined"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        fullWidth
      />
      <Box
        sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}
      >
        {chips.map((chip, index) => {
          if (chip === "AND") {
            return null; // Skip rendering "AND" as a Chip
            // Uncomment the following lines if you want to render "AND" as a Chip
            // Render "AND" as a regular Chip
            // return (
            //   <Chip
            //     key={index}
            //     label={chip}
            //     onDelete={() => handleDelete(chip)}
            //     color="primary"
            //   />
            // );
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
              />
            );
          }
          return null;
        })}
      </Box>
    </Box>
  );
};

export default ChipSearch;
