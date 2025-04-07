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
  Autocomplete,
  Box,
  Chip,
  Menu,
  MenuItem,
  Popper,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

const KeyValueChip = ({
  keyLabel,
  value,
  symbol = "=",
  modifier = "value",
  availableModifiers = [
    "count",
    "length",
    "max",
    "mean",
    "median",
    "min",
    "sum",
    "value",
  ],
  availableKeys = [
    "assembly_level",
    "assembly_span",
    "c_value",
    "genome_size",
    "tax",
  ],
  onChange,
  onDelete,
}) => {
  // Format numbers with suffixes (k, M, G, etc.)
  const formatValue = (val) => {
    if (val === null || val === undefined || val == "") {
      return ""; // Return empty string for null or undefined values
    }
    if (isNaN(val)) {
      return val; // Return non-numeric values as-is
    }
    const suffixes = ["", "k", "M", "G", "T", "P"];
    let num = parseFloat(val);
    let tier = 0;

    while (num >= 1000 && tier < suffixes.length - 1) {
      const nextNum = num / 1000;
      if (nextNum.toString().match(/^\d+\.\d{4}/)) {
        return (num * Math.pow(10, tier * 3)).toLocaleString(); // Format the number with commas
      } else {
        num = nextNum;
        tier++;
      }
    }

    return tier === 0 ? num.toString() : `${num}${suffixes[tier]}`;
  };
  const [anchorElSymbol, setAnchorElSymbol] = useState(null);
  const [anchorElModifier, setAnchorElModifier] = useState(null);
  const [anchorElValue, setAnchorElValue] = useState(null);
  const [currentModifier, setCurrentModifier] = useState(modifier);
  const [currentSymbol, setCurrentSymbol] = useState(symbol);
  const [currentValue, setCurrentValue] = useState(formatValue(value));
  const [currentKey, setCurrentKey] = useState(keyLabel);
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [anchorElKey, setAnchorElKey] = useState(null);
  // Determine the available operators based on the keyLabel
  const availableOperators =
    keyLabel === "tax"
      ? ["name", "tree", "eq", "lineage", "rank", "level"]
      : ["=", ">", ">=", "<", "<=", "!="];

  // Parse values with suffixes back into numbers
  const parseValue = (val) => {
    const suffixes = { k: 1e3, M: 1e6, G: 1e9, T: 1e12, P: 1e15 };
    const match = val.replace(",", "").match(/^([\d.]+)([kMGTPE]?)$/);
    if (!match) {
      return val; // Return as-is if no suffix is found
    }
    const [, number, suffix] = match;
    return parseFloat(number) * (suffixes[suffix] || 1);
  };

  const handleSymbolClick = (event) => {
    setAnchorElSymbol(event.currentTarget);
  };

  const handleModifierClick = (event) => {
    event.stopPropagation(); // Prevent the click event from propagating to the parent
    event.preventDefault(); // Prevent the default action
    setAnchorElModifier(event.currentTarget);
  };

  const handleModifierMenuClose = (newModifier) => {
    if (newModifier) {
      setCurrentModifier(newModifier);
      onChange?.({
        key: keyLabel,
        value: parseValue(currentValue),
        symbol: currentSymbol,
        modifier: newModifier,
      });
    }
    setAnchorElModifier(null);
  };

  const handleMenuClose = (newSymbol) => {
    if (newSymbol) {
      setCurrentSymbol(newSymbol);
      onChange?.({
        key: keyLabel,
        value: parseValue(currentValue),
        modifier: currentModifier,
        symbol: newSymbol,
      });
    }
    setAnchorElSymbol(null);
  };

  const handleValueEdit = (event) => {
    setIsEditingValue(true);
    setAnchorElValue(event.currentTarget);
  };

  const handleValueChange = (event) => {
    setCurrentValue(event.target.value);
  };

  const handleValueBlur = (event) => {
    event.stopPropagation(); // Prevent the click event from propagating to the parent
    event.preventDefault(); // Prevent the default action
    console.log("blur");
    setIsEditingValue(false);
    setAnchorElValue(null);
    const parsedValue = parseValue(currentValue);
    setCurrentValue(formatValue(parsedValue)); // Reformat the value for display
    onChange?.({
      key: keyLabel,
      value: parsedValue,
      symbol: currentSymbol,
      modifier: currentModifier,
    });
  };

  const handleKeyEdit = (event) => {
    setIsEditingKey(true);
    setAnchorElKey(event.currentTarget);
  };

  const handleKeyChange = (event) => {
    setCurrentKey(event.target.value);
  };

  const handleKeyBlur = (event) => {
    event.stopPropagation(); // Prevent the click event from propagating to the parent
    event.preventDefault(); // Prevent the default action
    setIsEditingKey(false);
    setAnchorElKey(null);
    onChange?.({
      key: currentKey,
      value: parseValue(currentValue),
      symbol: currentSymbol,
      modifier: currentModifier,
    });
  };

  const handleDelete = () => {
    setCurrentKey(keyLabel);
    setCurrentModifier("value");
    setCurrentSymbol("=");
    setCurrentValue("");
    onDelete?.({ key: keyLabel, value: "", symbol: "=", modifier: "value" });
  };

  const truncate = (str, maxWidth = 30) => {
    // format comma separated lists with spaces and truncate if too long
    if (str.length > maxWidth) {
      const parts = str.split(",");
      const formattedParts = parts.map((part) => part.trim());
      const truncatedStr = formattedParts.join(", ");
      return `${truncatedStr.slice(0, maxWidth)}...`;
    }
    return str;
  };

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        "& .MuiChip-root": {
          padding: 0,
        },
      }}
    >
      <Chip
        label={
          <Box
            sx={{
              textAlign: "center",
              padding: "8px 12px", // Add padding to ensure content fits
              position: "relative",
              overflow: "visible",
              marginLeft: "1em", // Add margin to the left for spacing
            }}
          >
            {modifier && (
              <span
                style={{
                  position: "absolute",
                  marginLeft: "-26px",
                  left: 0,
                  top: "8px",
                  height: "60px",
                  width: "30px",
                  fontSize: "1em",
                  lineHeight: "28px",
                  textOrientation: "mixed",
                  writingMode: "vertical-lr",
                  transform: "rotate(180deg)",
                  color: "#ffffff",
                  display: "block",
                  overflow: "visible",
                  backgroundColor: "#808080",
                  // padding: "0 6px",
                  borderRadius: "0 16px 16px 0",
                  borderLeft:
                    modifier == "value" ? "none" : "2px solid #666666",
                  boxSizing: "border-box",
                  cursor: "pointer",
                  opacity: modifier == "value" ? 0.25 : 1,
                }}
                onClick={handleModifierClick}
              >
                {modifier == "value" ? "" : modifier}
              </span>
            )}
            <Typography
              variant="body2"
              ref={anchorElKey}
              sx={{
                fontWeight: "bold",
                whiteSpace: "nowrap",
                height: "30px", // Ensure the key label has a fixed height
                lineHeight: "30px", // Center the text vertically
                opacity: currentValue && !isEditingKey ? 1 : 0.5,
                cursor: "pointer",
              }}
              onClick={handleKeyEdit}
            >
              {currentKey}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "flexstart",
                justifyContent: "center",
                gap: 0.5,
                height: "30px", // Ensure the operator and value have a fixed height
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  backgroundColor: "#808080",
                  borderRadius: "4px",
                  padding: "2px 4px",
                  height: "1.1em", // Ensure the operator has a fixed height
                  lineHeight: "1.1em", // Center the text vertically
                  marginTop: "6px",
                }}
                onClick={handleSymbolClick}
              >
                {currentSymbol}
              </Typography>

              <Typography
                variant="body2"
                ref={anchorElValue}
                sx={{
                  cursor: "pointer",
                  whiteSpace: currentValue.length > 100 ? "normal" : "nowrap", // Wrap text if too long
                  wordBreak:
                    currentValue.length > 100 ? "break-word" : "normal", // Break long words if necessary
                  opacity: currentValue && !isEditingValue ? 1 : 0.5,
                  fontStyle: currentValue ? "normal" : "italic",
                  marginTop: "6px",
                }}
                onClick={isEditingValue ? handleValueBlur : handleValueEdit}
              >
                {truncate(currentValue) || "value"}
              </Typography>
            </Box>
          </Box>
        }
        onDelete={handleDelete} // Add delete functionality
        sx={{
          padding: "0 0 0 1em", // Ensure padding around the chip content
          height: "60px", // Increase the chip height
          "& .MuiChip-label": { display: "block", padding: "1em" }, // Ensure padding around the label
          // Shade the top half of the chip
          background: "linear-gradient(to bottom, #808080 50%, #f0f0f0 50%)",
          // offset the delete icon so it is in the top half of the chip, not centered vertically
          "& .MuiChip-deleteIcon": {
            marginTop: "-28px", // Adjust this value to move the delete icon up
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
      {isEditingValue && (
        <Popper
          open={isEditingValue}
          anchorEl={anchorElValue}
          placement="bottom"
          modifiers={[
            {
              name: "offset",
              // options: {
              //   offset: [0, 8], // Adjust the offset as needed
              // },
            },
          ]}
        >
          <Box
            sx={{
              padding: "8px",
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
              boxShadow:
                "0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)",
            }}
          >
            <TextField
              value={currentValue}
              // onChange={handleValueChange}
              onBlur={handleValueBlur}
              multiline={currentValue.length * 8 > 100} // Allow multiline if value is too long
              maxRows={Math.min(Math.ceil((currentValue.length * 8) / 100), 10)} // Limit to 2 rows
              size="small"
              variant="standard"
              autoFocus
              sx={{
                marginTop: "4px",
                width: `${currentValue.length * 8 > 100 ? 400 : currentValue.length * 8 + 40}px`, // Dynamically set width based on value length
                "& .MuiInputBase-input": {
                  textAlign: "center", // Center-align the text
                },
                "& .MuiInputBase-root": {
                  backgroundColor: "#f0f0f0",
                  borderRadius: "4px",
                  padding: "0 2px 2px 2px",
                },
              }}
            />
          </Box>
        </Popper>
      )}
      {isEditingKey && (
        <Popper
          open={isEditingKey}
          anchorEl={anchorElKey}
          placement="bottom"
          modifiers={[
            {
              name: "offset",
              options: {
                offset: [0, 8], // Adjust the offset as needed
              },
            },
          ]}
        >
          <Box
            sx={{
              padding: "8px",
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
              boxShadow:
                "0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)",
            }}
          >
            <Autocomplete
              options={availableKeys} // Restrict options to availableKeys
              value={currentKey}
              onChange={(event, newValue) => {
                setCurrentKey(newValue || ""); // Update the key with the selected value
              }}
              onBlur={(event) => {
                handleKeyBlur(event); // Trigger the blur handler
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  variant="standard"
                  autoFocus
                  sx={{
                    marginTop: "4px",
                    width: `${Math.max(currentKey.length, 12) * 12 + 40}px`, // Dynamically set width based on key length
                    "& .MuiInputBase-input": {
                      textAlign: "center", // Center-align the text
                    },
                    "& .MuiInputBase-root": {
                      backgroundColor: "#f0f0f0",
                      borderRadius: "4px",
                      padding: "0 2px 2px 2px",
                    },
                  }}
                />
              )}
            />
          </Box>
        </Popper>
      )}
      <Menu
        anchorEl={anchorElSymbol}
        open={Boolean(anchorElSymbol)}
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
      <Menu
        anchorEl={anchorElModifier}
        open={Boolean(anchorElModifier)}
        onClose={() => handleModifierMenuClose()}
        MenuListProps={{
          sx: {
            overflow: "visible", // Allow the menu to extend beyond the chip
          },
        }}
      >
        {availableModifiers.map((modifier) => (
          <MenuItem
            key={modifier}
            onClick={() => handleModifierMenuClose(modifier)}
            selected={modifier === currentModifier}
          >
            {modifier}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default KeyValueChip;
