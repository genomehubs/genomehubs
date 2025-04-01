/**
 * KeyValueChip Component
 *
 * This component takes `key`, `value`, and `symbol` variables and presents them in a styled Material-UI chip.
 * The key is displayed on a row above the operator and value.
 *
 * Features:
 * - Supports interaction to change the operator to any of [=, >=, <=] by default.
 * - When `keyLabel === "tax"`, the operators are drawn from [name, tree, eq, lineage].
 * - Allows editing the value as a string.
 * - Takes an `onChange` function variable to pass the edited value back to its parent.
 * - Includes an `onDelete` function to clear all values.
 */

import {
  Box,
  Chip,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

const KeyValueChip = ({
  keyLabel,
  value,
  symbol = "=",
  onChange,
  onDelete,
}) => {
  // Format numbers with suffixes (k, M, G, etc.)
  const formatValue = (val) => {
    if (isNaN(val)) {
      return val; // Return non-numeric values as-is
    }
    const suffixes = ["", "k", "M", "G", "T", "P"];
    let num = parseFloat(val);
    let tier = 0;

    while (num >= 1000 && tier < suffixes.length - 1) {
      const nextNum = num / 1000;
      if (nextNum.toString().match(/^\d+\.\d{4}/)) {
        return val; // If more than 3 decimal places are required, return full number
      } else {
        num = nextNum;
        tier++;
      }
    }

    return tier === 0 ? num.toString() : `${num}${suffixes[tier]}`;
  };
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentSymbol, setCurrentSymbol] = useState(symbol);
  const [currentValue, setCurrentValue] = useState(formatValue(value));
  const [isEditing, setIsEditing] = useState(false);

  // Determine the available operators based on the keyLabel
  const availableOperators =
    keyLabel === "tax" ? ["name", "tree", "eq", "lineage"] : ["=", ">=", "<="];

  // Parse values with suffixes back into numbers
  const parseValue = (val) => {
    const suffixes = { k: 1e3, M: 1e6, G: 1e9, T: 1e12, P: 1e15 };
    const match = val.match(/^([\d.]+)([kMGTPE]?)$/);
    if (!match) {
      return val; // Return as-is if no suffix is found
    }
    const [, number, suffix] = match;
    return parseFloat(number) * (suffixes[suffix] || 1);
  };

  const handleChipClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (newSymbol) => {
    if (newSymbol) {
      setCurrentSymbol(newSymbol);
      onChange?.({
        key: keyLabel,
        value: parseValue(currentValue),
        symbol: newSymbol,
      });
    }
    setAnchorEl(null);
  };

  const handleValueEdit = () => {
    setIsEditing(true);
  };

  const handleValueChange = (event) => {
    setCurrentValue(event.target.value);
  };

  const handleValueBlur = () => {
    setIsEditing(false);
    const parsedValue = parseValue(currentValue);
    setCurrentValue(formatValue(parsedValue)); // Reformat the value for display
    onChange?.({ key: keyLabel, value: parsedValue, symbol: currentSymbol });
  };

  const handleDelete = () => {
    setCurrentSymbol("=");
    setCurrentValue("");
    onDelete?.({ key: keyLabel, value: "", symbol: "=" });
  };

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center" }}>
      <Chip
        label={
          <Box
            sx={{
              textAlign: "center",
              padding: "8px 12px", // Add padding to ensure content fits
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}
            >
              {keyLabel}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{ cursor: "pointer", whiteSpace: "nowrap" }}
                onClick={handleChipClick}
              >
                {currentSymbol}
              </Typography>
              {isEditing ? (
                <TextField
                  value={currentValue}
                  onChange={handleValueChange}
                  onBlur={handleValueBlur}
                  size="small"
                  variant="standard"
                  autoFocus
                  sx={{
                    width: "80px",
                    "& .MuiInputBase-input": {
                      textAlign: "center", // Center-align the text
                    },
                  }}
                />
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                  onClick={handleValueEdit}
                >
                  {currentValue}
                </Typography>
              )}
            </Box>
          </Box>
        }
        onDelete={handleDelete} // Add delete functionality
        sx={{
          padding: 0, // Ensure padding around the chip content
          height: "48px", // Increase the chip height
          "& .MuiChip-label": { display: "block", padding: 1 }, // Ensure padding around the label
          // Shade the top half of the chip
          background: "linear-gradient(to bottom, #808080 50%, #f0f0f0 50%)",
          // offset the delete icon so it is in the top half of the chip, not centered vertically
          "& .MuiChip-deleteIcon": {
            marginTop: "-1em", // Adjust this value to move the delete icon up
            color: "#f0f0f0", // Change the delete icon color to match the top half
          },
          "&:hover": {
            background: "linear-gradient(to bottom, #808080 50%, #f0f0f0 50%)",
          },
          "&:active": {
            background: "linear-gradient(to bottom, #808080 50%, #f0f0f0 50%)",
          },
        }}
      />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleMenuClose()}
        MenuListProps={{
          sx: {
            overflow: "visible", // Allow the menu to extend beyond the chip
          },
        }}
      >
        {availableOperators.map((operator) => (
          <MenuItem
            key={operator}
            onClick={() => handleMenuClose(operator)}
            selected={operator === currentSymbol}
          >
            {operator}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default KeyValueChip;
