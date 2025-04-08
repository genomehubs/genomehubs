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

const listOperators = (keyLabel) => {
  // Define the available operators based on the keyLabel

  if (keyLabel === "tax") {
    return ["name", "tree", "eq", "lineage", "rank", "level"];
  } else {
    return ["=", ">", ">=", "<", "<=", "!="];
  }
};

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

  let darkColor = "hsl(204, 70.60%, 31.40%)";
  let lightColor = "#a6cee3";
  let backgroundColor = "#808080";
  let borderColor = "#1f78b4";
  let textColor = "#ffffff";

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
  const [availableOperators, setAvailableOperators] = useState(
    listOperators(keyLabel),
  );

  if (keyLabel === "tax") {
    modifier = undefined;
  }
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
    if (isEditingKey) {
      event.stopPropagation(); // Prevent the click event from propagating to the parent
      event.preventDefault(); // Prevent the default action
      handleKeyBlur(event);
    } else {
      setIsEditingKey(true);
      setAnchorElKey(event.currentTarget);
    }
  };

  const handleKeyBlur = (event) => {
    event.stopPropagation(); // Prevent the click event from propagating to the parent
    event.preventDefault(); // Prevent the default action
    setIsEditingKey(false);
    setAnchorElKey(null);
    let newOperators = listOperators(currentKey);
    setAvailableOperators(newOperators);
    let newSymbol = currentSymbol;
    if (!newOperators.includes(currentSymbol)) {
      newSymbol = newOperators[0]; // Reset to the first operator if the current one is not available
      setCurrentSymbol(newSymbol);
    }
    onChange?.({
      key: currentKey,
      value: parseValue(currentValue),
      symbol: newSymbol,
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
              padding: "8px 12px",
              position: "relative",
              overflow: "visible",
              marginLeft: "1em",
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
                  color: textColor,
                  display: "block",
                  overflow: "visible",
                  backgroundColor: borderColor,
                  borderRadius: modifier == "value" ? "0 16px 16px 0" : "16px",
                  border:
                    modifier == "value" ? "none" : `2px solid ${darkColor}`,
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
                height: "30px",
                lineHeight: "30px",
                color: textColor,
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
                height: "30px",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  backgroundColor: borderColor,
                  color: textColor,
                  borderRadius: "4px",
                  padding: "2px 4px",
                  height: "1.1em",
                  lineHeight: "1.1em",
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
                  whiteSpace: currentValue.length > 100 ? "normal" : "nowrap",
                  wordBreak:
                    currentValue.length > 100 ? "break-word" : "normal",
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
        onDelete={handleDelete}
        sx={{
          padding: "0 0 0 1em",
          height: "60px",
          "& .MuiChip-label": { display: "block", padding: "1em" },
          background: `linear-gradient(to bottom, ${borderColor} 50%, ${lightColor} 50%)`,
          "& .MuiChip-deleteIcon": {
            marginTop: "-28px",
            color: lightColor,
          },
          "&:hover": {
            background: `linear-gradient(to bottom, ${borderColor} 50%, ${lightColor} 50%)`,
          },
          "&:active": {
            background: `linear-gradient(to bottom, ${borderColor} 50%, ${lightColor} 50%)`,
          },
        }}
      />
      {isEditingValue && (
        <Popper
          open={isEditingValue}
          anchorEl={anchorElValue}
          placement="bottom"
        >
          <Box
            sx={{
              padding: "8px",
              backgroundColor: borderColor,
              borderRadius: "4px",
              boxShadow:
                "0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)",
            }}
          >
            <TextField
              value={currentValue}
              onChange={handleValueChange}
              onBlur={handleValueBlur}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleValueBlur(event);
                }
              }}
              multiline={currentValue.length * 8 > 100}
              maxRows={Math.min(Math.ceil((currentValue.length * 8) / 100), 10)}
              size="small"
              variant="standard"
              autoFocus
              sx={{
                marginTop: "4px",
                width: `${currentValue.length * 8 > 100 ? 400 : currentValue.length * 8 + 40}px`,
                "& .MuiInputBase-input": {
                  textAlign: "center",
                },
                "& .MuiInputBase-root": {
                  backgroundColor: borderColor,
                  color: textColor,
                  borderRadius: "4px",
                  padding: "0 2px 2px 2px",
                },
              }}
            />
          </Box>
        </Popper>
      )}
      {isEditingKey && (
        <Popper open={isEditingKey} anchorEl={anchorElKey} placement="bottom">
          <Box
            sx={{
              padding: "8px",
              backgroundColor: borderColor,
              color: textColor,
              borderRadius: "4px",
              boxShadow:
                "0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)",
            }}
          >
            <Autocomplete
              options={availableKeys}
              value={currentKey}
              onChange={(event, newValue) => {
                setCurrentKey(newValue || "");
              }}
              onBlur={(event) => {
                handleKeyBlur(event);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleKeyBlur(event);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  variant="standard"
                  autoFocus
                  sx={{
                    marginTop: "4px",
                    width: `${Math.max(currentKey.length, 12) * 12 + 40}px`,
                    "& .MuiInputBase-input": {
                      textAlign: "center",
                    },
                    "& .MuiInputBase-root": {
                      backgroundColor: borderColor,
                      color: textColor,
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
            overflow: "visible",
            backgroundColor: lightColor,
            "& .MuiMenuItem-root": {
              backgroundColor: lightColor,
              "&.Mui-selected": {
                backgroundColor: borderColor,
                color: textColor,
              },
              "&:hover, &.Mui-focusVisible": {
                backgroundColor: darkColor,
                color: textColor,
              },
            },
          },
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
          }
        }}
      >
        {availableOperators.map((operator, index) => (
          <MenuItem
            key={operator}
            onClick={() => handleMenuClose(operator)}
            selected={operator === currentSymbol}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleMenuClose(operator);
              }
            }}
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
            overflow: "visible",
            backgroundColor: lightColor,
            "& .MuiMenuItem-root": {
              backgroundColor: lightColor,
              "&.Mui-selected": {
                backgroundColor: borderColor,
                color: textColor,
              },
              "&:hover, &.Mui-focusVisible": {
                backgroundColor: darkColor,
                color: textColor,
              },
            },
          },
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
          }
        }}
      >
        {availableModifiers.map((modifier, index) => (
          <MenuItem
            key={modifier}
            onClick={() => handleModifierMenuClose(modifier)}
            selected={modifier === currentModifier}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleModifierMenuClose(modifier);
              }
            }}
          >
            {modifier}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default KeyValueChip;
