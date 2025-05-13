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

import React, { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import EditableText from "../EditableText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Popper from "@mui/material/Popper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ValidationErrorTooltip from "./ValidationErrorToolTip";
import formatValue from "./functions/formatValue";
import parseValue from "./functions/parseValue";
import typesToValidation from "./functions/typesToValidation";

const listModifiers = (keyLabel) => {
  // Define the available modifiers based on the keyLabel
  if (keyLabel === "tax") {
    return ["name", "tree", "eq", "lineage", "rank", "level"];
  } else {
    return ["count", "length", "max", "mean", "median", "min", "sum", "value"];
  }
};

const chipPalettes = {
  blue: {
    dark: "#185b89",
    light: "#a6cee3",
    background: "#1f78b4",
    text: "#ffffff",
  },
  green: {
    dark: "#277821",
    light: "#b2df8a",
    background: "#33a02c",
    text: "#ffffff",
  },
  red: {
    dark: "#b51517",
    light: "#fb9a99",
    background: "#e31a1c",
    text: "#ffffff",
  },
  orange: {
    dark: "#cc6600",
    light: "#fdbf6f",
    background: "#ff7f00",
    text: "#ffffff",
  },
  purple: {
    dark: "#512f76",
    light: "#cab2d6",
    background: "#6a3d9a",
    text: "#ffffff",
  },
  yellow: {
    dark: "#87431f",
    light: "#ffff99",
    background: "#b15928",
    text: "#000000",
  },
  grey: {
    dark: "#636363",
    light: "#bdbdbd",
    background: "#969696",
    text: "#ffffff",
  },
  black: {
    dark: "#000000",
    light: "#bdbdbd",
    background: "#000000",
    text: "#ffffff",
  },
  white: {
    dark: "#ffffff",
    light: "#bdbdbd",
    background: "#ffffff",
    text: "#000000",
  },
};

const KeyValueChip = ({
  keyLabel,
  value,
  valueNote,
  symbol = "=",
  modifier = "value",
  onChange,
  onDelete,
  palette = "blue",
}) => {
  const validation = typesToValidation();

  const colorsFromPalette = (palette) => {
    // Check if the palette exists in the chipPalettes object
    if (chipPalettes[palette]) {
      return {
        darkColor: chipPalettes[palette].dark,
        lightColor: chipPalettes[palette].light,
        backgroundColor: chipPalettes[palette].background,
        textColor: chipPalettes[palette].text,
      };
    } else {
      // If the palette doesn't exist, return default colors
      return {
        darkColor: chipPalettes["blue"].dark,
        lightColor: chipPalettes["blue"].light,
        backgroundColor: chipPalettes["blue"].background,
        textColor: chipPalettes["blue"].text,
      };
    }
  };

  const [anchorElSymbol, setAnchorElSymbol] = useState(null);
  const [anchorElModifier, setAnchorElModifier] = useState(null);
  const [anchorElValue, setAnchorElValue] = useState(null);
  const [currentModifier, setCurrentModifier] = useState(modifier);
  const [currentOperator, setCurrentOperator] = useState(symbol);
  const [currentValue, setCurrentValue] = useState(
    keyLabel === "tax" ? value : formatValue(value),
  );
  const [previousValue, setPreviousValue] = useState(
    keyLabel === "tax" ? value : formatValue(value),
  );
  const [currentValueNote, setCurrentValueNote] = useState(valueNote);
  const [previousValueNote, setPreviousValueNote] = useState(valueNote);
  const [currentKey, setCurrentKey] = useState(keyLabel);
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [anchorElKey, setAnchorElKey] = useState(null);
  // Determine the available operators based on the keyLabel
  const [availableOperators, setAvailableOperators] = useState([
    ...validation.validOperators(keyLabel, modifier),
  ]);
  const [availableModifiers, setAvailableModifiers] = useState(
    listModifiers(keyLabel),
  );
  const [{ darkColor, lightColor, backgroundColor, textColor }, setColors] =
    useState(colorsFromPalette(palette));
  const [validationError, setValidationError] = useState(false);

  const handleSymbolClick = (event) => {
    setAnchorElSymbol(event.currentTarget);
  };

  const handleModifierClick = (event) => {
    event.stopPropagation(); // Prevent the click event from propagating to the parent
    event.preventDefault(); // Prevent the default action
    setAnchorElModifier(event.currentTarget);
  };

  const handleModifierMenuClose = (newModifier) => {
    let processedModifier = newModifier;
    if (processedModifier === "") {
      processedModifier = "value"; // Default to "value" if empty
    }
    if (processedModifier) {
      setCurrentModifier(processedModifier);
      onChange?.({
        key: keyLabel,
        value: parseValue(currentValue),
        symbol: currentOperator,
        modifier: processedModifier,
        palette,
      });
    }
    setAnchorElModifier(null);
  };

  const handleMenuClose = (newSymbol) => {
    if (newSymbol) {
      setCurrentOperator(newSymbol);
      onChange?.({
        key: keyLabel,
        value: parseValue(currentValue),
        modifier: currentModifier,
        symbol: newSymbol,
        palette,
      });
    }
    setAnchorElSymbol(null);
  };

  const handleValueChange = (event) => {
    setCurrentValue(event.target.value);
    setCurrentValueNote(undefined);
  };

  const handleValueBlur = (event) => {
    event.stopPropagation(); // Prevent the click event from propagating to the parent
    event.preventDefault(); // Prevent the default action
    setIsEditingValue(false);
    setAnchorElValue(null);
    const parsedValue = parseValue(currentValue);
    setCurrentValue(keyLabel == "tax" ? parsedValue : formatValue(parsedValue)); // Reformat the value for display
    setPreviousValue(
      keyLabel == "tax" ? parsedValue : formatValue(parsedValue),
    );
    setPreviousValueNote(undefined);
    onChange?.({
      key: keyLabel,
      value: parsedValue,
      valueNote: undefined,
      symbol: currentOperator,
      modifier: currentModifier,
      palette,
    });
  };

  const handleKeyBlur = (event) => {
    event.stopPropagation(); // Prevent the click event from propagating to the parent
    event.preventDefault(); // Prevent the default action
    setIsEditingKey(false);
    setAnchorElKey(null);
    let newOperators = validation.validOperators(currentKey, currentModifier);
    setAvailableOperators([...newOperators]);
    let newOperator = currentOperator;
    if (!newOperators.has(currentOperator)) {
      newOperator = [...newOperators][0]; // Convert the set to an array and reset to the first operator if the current one is not available
      setCurrentOperator(newOperator);
    }
    onChange?.({
      key: currentKey,
      value: parseValue(currentValue),
      symbol: newOperator,
      modifier: currentModifier,
      palette,
    });
  };

  const handleDelete = () => {
    setCurrentKey(keyLabel);
    setCurrentModifier("value");
    setCurrentOperator("=");
    setCurrentValue("");
    setCurrentValueNote(undefined);
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

  const validateChip = ({ key, value, operator, modifier }) => {
    // Validate the key, value, operator, and modifier
    if (modifier == "collate") {
      value = `${key},${value}`;
      key = "collate";
    }
    let { valid, reason } = validation.validateKey(key);
    if (!valid) {
      setValidationError({ reason, component: "key" });
      return false;
    }
    ({ valid, reason } = validation.validateValue({
      key,
      value,
      modifier,
    }));
    if (!valid) {
      setValidationError({ reason, component: "value" });
      return false;
    }
    ({ valid, reason } = validation.validateOperator({ key, operator }));
    if (!valid) {
      setValidationError({ reason, component: "operator" });
      return false;
    }
    ({ valid, reason } = validation.validateModifier({ key, modifier }));
    if (!valid) {
      setValidationError({ reason, component: "modifier" });
      return false;
    }
    setValidationError(false);
    return true;
  };

  useEffect(() => {
    if (validationError || (!isEditingValue && !isEditingKey)) {
      // Validate the chip data when it loses focus
      const isValid = validateChip({
        key: currentKey,
        value: currentValue,
        operator: currentOperator,
        modifier: currentModifier,
      });

      if (!isValid) {
        setColors(colorsFromPalette("orange"));
      } else {
        setColors(colorsFromPalette(palette));
      }
    }
  }, [
    isEditingValue,
    isEditingKey,
    currentKey,
    currentValue,
    currentOperator,
    currentModifier,
  ]);

  let { component: errorComponent } = validationError || {};
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
            {currentModifier && (
              <span
                style={{
                  position: "absolute",
                  marginLeft: "-26px",
                  left: 0,
                  top: "8px",
                  height: "60px",
                  width: "30px",
                  fontSize: "1em",
                  fontWeight: "bold",
                  lineHeight: "28px",
                  textOrientation: "mixed",
                  writingMode: "vertical-lr",
                  transform: "rotate(180deg)",
                  color: `${textColor}dd`,
                  display: "block",
                  overflow: "visible",
                  backgroundColor: backgroundColor,
                  borderRadius: "0 16px 16px 0",
                  borderLeft:
                    currentModifier == "value"
                      ? "none"
                      : `1px solid ${darkColor}80`,
                  boxSizing: "border-box",
                  cursor: "pointer",
                  opacity: currentModifier == "value" ? 0.25 : 1,
                }}
                onClick={handleModifierClick}
              >
                {currentModifier == "value" ? "" : currentModifier}
                {errorComponent == "modifier" && (
                  <span
                    style={{
                      position: "absolute",

                      right: "1em",
                      bottom: 0,
                      display: "block",
                      overflow: "visible",
                    }}
                  >
                    <ValidationErrorTooltip
                      validationError={validationError.reason}
                      textColor={textColor}
                    />
                  </span>
                )}
              </span>
            )}
            <EditableText
              value={currentKey}
              onChange={setCurrentKey}
              onBlur={handleKeyBlur}
              backgroundColor={backgroundColor}
              textColor={textColor}
              anchorEl={anchorElKey}
              setAnchorEl={setAnchorElKey}
              options={[...validation.validKeys().keys]}
              variant="body2"
              sx={{
                fontWeight: "bold",
                whiteSpace: "nowrap",
                height: "30px",
                lineHeight: "30px",
                marginRight: validationError ? "-1em" : "0",
              }}
              endComponent={
                errorComponent == "key" && (
                  <ValidationErrorTooltip
                    validationError={validationError.reason}
                    textColor={textColor}
                  />
                )
              }
            />

            <Box
              sx={{
                display: "flex",
                alignItems: "flexstart",
                justifyContent: "center",
                gap: 0.5,
                height: "30px",
                opacity: currentValue ? 1 : 0.5,
              }}
            >
              {symbol !== null && (
                <Typography
                  variant="body2"
                  sx={{
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    backgroundColor: backgroundColor,
                    color: textColor,
                    borderRadius: "4px",
                    padding: "2px 4px",
                    height: "1.1em",
                    lineHeight: "1.1em",
                    marginTop: "6px",
                  }}
                  onClick={handleSymbolClick}
                >
                  {currentOperator}
                  {errorComponent == "operator" && (
                    <span
                      style={{
                        position: "absolute",
                        marginLeft: "0.25em",
                        bottom: 0,
                        marginBottom: "1.5em",
                        display: "block",
                        overflow: "visible",
                      }}
                    >
                      <ValidationErrorTooltip
                        validationError={validationError.reason}
                        textColor={textColor}
                      />
                    </span>
                  )}
                </Typography>
              )}

              {/* <Typography
                variant="body2"
                ref={(el) => setAnchorElValue(el)} // Use a ref-setter function
                sx={{
                  cursor: "pointer",
                  whiteSpace: previousValue.length > 100 ? "normal" : "nowrap",
                  wordBreak:
                    previousValue.length > 100 ? "break-word" : "normal",
                  opacity: previousValue && !isEditingValue ? 1 : 0.5,
                  fontStyle: previousValue ? "normal" : "italic",
                  marginTop: "6px",
                }}
                onClick={isEditingValue ? handleValueBlur : handleValueEdit}
              >
                {truncate(previousValue) || "value"}
              </Typography> */}
              <EditableText
                value={truncate(currentValue) || "value"}
                onChange={setCurrentValue}
                onBlur={handleValueBlur}
                backgroundColor={backgroundColor}
                textColor={null}
                anchorEl={anchorElValue}
                setAnchorEl={setAnchorElValue}
                endComponent={
                  <>
                    {errorComponent == "value" && (
                      <ValidationErrorTooltip
                        validationError={validationError.reason}
                        textColor={textColor}
                      />
                    )}
                    <Typography
                      variant="body3"
                      sx={{
                        opacity: 0.5,
                        fontStyle: "italic",
                        fontSize: "0.8em",
                        marginTop: "1px",
                        marginLeft: "0.25em",
                        pointerEvents: "none",
                      }}
                    >
                      {previousValueNote}
                    </Typography>
                  </>
                }
                options={[...(validation.validValues(currentKey) || [])]}
                variant="body3"
                sx={{
                  whiteSpace: previousValue.length > 100 ? "normal" : "nowrap",
                  wordBreak:
                    previousValue.length > 100 ? "break-word" : "normal",
                  opacity: previousValue && !isEditingValue ? 1 : 0.5,
                  fontStyle: previousValue ? "normal" : "italic",
                  marginTop: "2px",
                }}
              />
            </Box>
          </Box>
        }
        onDelete={handleDelete}
        sx={{
          padding: "0 0 0 1em",
          height: "60px",
          "& .MuiChip-label": { display: "block", padding: "1em" },
          background: `linear-gradient(to bottom, ${backgroundColor} 50%, ${lightColor} 50%)`,
          "& .MuiChip-deleteIcon": {
            marginTop: "-28px",
            color: lightColor,
          },
          "&:hover": {
            background: `linear-gradient(to bottom, ${backgroundColor} 50%, ${lightColor} 50%)`,
          },
          "&:active": {
            background: `linear-gradient(to bottom, ${backgroundColor} 50%, ${lightColor} 50%)`,
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
              backgroundColor: backgroundColor,
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
              multiline={previousValue.length * 8 > 100}
              maxRows={Math.min(
                Math.ceil((previousValue.length * 8) / 100),
                10,
              )}
              size="small"
              variant="standard"
              autoFocus
              sx={{
                marginTop: "4px",
                transition: "width 0.2s ease", // Smoothly transition width changes
                width: `${Math.min(previousValue.length * 8 + 40, 400)}px`, // Cap width at 400px
                "& .MuiInputBase-input": {
                  textAlign: "center",
                },
                "& .MuiInputBase-root": {
                  backgroundColor: backgroundColor,
                  color: textColor,
                  borderRadius: "4px",
                  padding: "0 2px 2px 2px",
                },
              }}
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
                backgroundColor: backgroundColor,
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
            selected={operator === currentOperator}
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
                backgroundColor: backgroundColor,
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
        {[...validation.validModifiers(currentKey)].map((modifier, index) => (
          <MenuItem
            key={modifier}
            onClick={() => handleModifierMenuClose(modifier)}
            selected={modifier === currentModifier}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleModifierMenuClose(modifier);
              }
            }}
            style={{ minHeight: "1.5em" }}
          >
            {modifier}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default KeyValueChip;
