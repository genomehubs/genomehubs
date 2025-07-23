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
import ClickAwayListener from "@mui/material/ClickAwayListener";
import EditableText from "../EditableText/EditableText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "../Tooltip";
import Typography from "@mui/material/Typography";
import ValidationErrorTooltip from "./ValidationErrorToolTip";
import { current } from "@reduxjs/toolkit";
import formatValue from "./functions/formatValue";
import { getChipPalette } from "./functions/chipPalettes";
import parseValue from "./functions/parseValue";
import typesToValidation from "./functions/typesToValidation";

const KeyValueChip = ({
  keyLabel,
  value,
  valueNote,
  operator = "=",
  modifier = "value",
  onChange,
  onDelete,
  palette = "blue",
  forcePalette = false,
  chipIndex = 0,
}) => {
  const validation = typesToValidation();
  const chipId = `${keyLabel}-${operator}-${value}-${modifier}`;
  const [anchorElSymbol, setAnchorElSymbol] = useState(null);
  const [anchorElModifier, setAnchorElModifier] = useState(null);
  const [anchorElValue, setAnchorElValue] = useState(null);
  const [currentModifier, setCurrentModifier] = useState(modifier);
  const [currentOperator, setCurrentOperator] = useState(operator);
  const [currentValue, setCurrentValue] = useState(
    value == "" ? null : keyLabel === "tax" ? value : formatValue(value),
  );
  const [previousValue, setPreviousValue] = useState(
    value == "" ? null : keyLabel === "tax" ? value : formatValue(value),
  );
  const [currentValueNote, setCurrentValueNote] = useState(valueNote);
  const [previousValueNote, setPreviousValueNote] = useState(valueNote);
  const [currentKey, setCurrentKey] = useState(keyLabel);
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [anchorElKey, setAnchorElKey] = useState(null);
  // Determine the available operators based on the keyLabel
  const [availableOperators, setAvailableOperators] = useState([
    ...validation.validOperators({ key: currentKey, modifier }),
  ]);
  const [{ darkColor, lightColor, backgroundColor, textColor }, setColors] =
    useState(getChipPalette(palette));
  const [validationError, setValidationError] = useState(false);

  const handleSymbolClick = (event) => {
    setAnchorElSymbol(event.currentTarget);
  };

  const handleModifierClick = (event) => {
    event.stopPropagation(); // Prevent the click event from propagating to the parent
    event.preventDefault(); // Prevent the default action
    setAnchorElModifier(event.currentTarget);
  };

  const handleChange = ({
    key,
    value,
    operator,
    modifier,
    palette,
    chipIndex,
    multi = false,
  }) => {
    const { processed_type } = validation.validateValue({
      key,
      value,
      modifier,
    });
    let parsedValue = value;
    if (multi) {
      parsedValue = value.split(",").map((v) => {
        if (["float", "integer"].includes(processed_type)) {
          return parseValue(v);
        }
        return v;
      });
    } else if (["float", "integer"].includes(processed_type)) {
      parsedValue = parseValue(value);
    }
    onChange?.(
      {
        key,
        value: parsedValue,
        operator,
        modifier,
        palette,
      },
      chipIndex,
    );
  };

  const handleModifierMenuClose = (newModifier) => {
    let processedModifier = newModifier;
    if (processedModifier === "") {
      processedModifier = "value"; // Default to "value" if empty
    }
    if (processedModifier) {
      setCurrentModifier(processedModifier);
      updateOperators(currentKey, processedModifier);
      handleChange({
        key: keyLabel,
        value: currentValue,
        operator: currentOperator,
        modifier: processedModifier,
        palette,
        chipIndex,
      });
    }
    setAnchorElModifier(null);
  };

  const handleMenuClose = (newOperator) => {
    if (newOperator) {
      setCurrentOperator(newOperator);
      handleChange({
        key: keyLabel,
        value: currentValue,
        modifier: currentModifier,
        operator: newOperator,
        palette,
        chipIndex,
      });
    }
    setAnchorElSymbol(null);
  };

  const handleValueChange = (newValue) => {
    setCurrentValue(newValue);
    handleChange({
      key: currentKey,
      value: newValue,
      operator: currentOperator,
      modifier: currentModifier,
      palette,
      chipIndex,
    });
  };

  const handleClickAway = () => {
    if (isEditingValue) {
      setIsEditingValue(false); // Stop editing when clicking outside
    }
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
  };

  const updateOperators = (key, modifier) => {
    let newOperators = validation.validOperators({
      key,
      modifier,
    });
    setAvailableOperators([...newOperators]);
    let newOperator = currentOperator;
    if (!newOperators.has(currentOperator)) {
      newOperator = [...newOperators][0] || null; // Convert the set to an array and reset to the first operator if the current one is not available
      setCurrentOperator(newOperator);
    }
  };

  const handleKeyChange = (newKey) => {
    setCurrentKey(newKey);
    // updateOperators(newKey, currentModifier);
    handleChange({
      key: newKey,
      value: currentValue,
      operator: currentOperator,
      modifier: currentModifier,
      palette,
      chipIndex,
    });
  };

  const handleKeyBlur = (event) => {
    event.stopPropagation(); // Prevent the click event from propagating to the parent
    event.preventDefault(); // Prevent the default action
    // setIsEditingKey(false);
    // setAnchorElKey(null);
  };

  const handleDelete = () => {
    setCurrentKey(keyLabel);
    setCurrentModifier("value");
    setCurrentOperator("=");
    setCurrentValue("");
    setCurrentValueNote(undefined);
    onDelete?.(
      { key: keyLabel, value: "", operator: "=", modifier: "value" },
      chipIndex,
    );
  };

  const validateChip = ({ key, value, operator, modifier }) => {
    // Validate the key, value, operator, and modifier
    if (modifier == "collate") {
      value = `${key},${value}`;
      key = "collate";
    }
    let { valid, color, reason } = validation.validateKey({ key });
    if (!valid) {
      setValidationError({ reason, component: "key" });
      return false;
    }
    ({ valid, reason } = validation.validateModifier({ key, modifier }));
    if (!valid) {
      setValidationError({ reason, component: "modifier" });
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
    ({ valid, reason } = validation.validateOperator({
      key,
      modifier,
      operator,
    }));
    if (!valid) {
      setValidationError({ reason, component: "operator" });
      return false;
    }
    setValidationError(false);
    return { isValid: true, chipColor: color };
  };

  const handleChipClick = (event, offset = { x: 0, y: 0 }) => {
    if (event.target === event.currentTarget) {
      const boundingBox = event.currentTarget.getBoundingClientRect();
      const clickY = event.clientY - boundingBox.top - offset.y;
      const clickX = event.clientX - boundingBox.left - offset.x;

      if (clickY <= 30 || (currentOperator === null && clickX <= 30)) {
        return;
      }

      if (isEditingValue) {
        handleValueBlur(event);
      } else {
        setIsEditingValue(true);
      }
    }
  };

  const handleSplitValues = (event, { value }) => {
    event.stopPropagation(); // Prevent the click event from propagating to the parent
    event.preventDefault(); // Prevent the default action

    handleChange({
      key: currentKey,
      value,
      operator: currentOperator,
      modifier: currentModifier,
      palette,
      chipIndex,
      multi: true,
    });
  };

  useEffect(() => {
    if (validationError || (!isEditingValue && !isEditingKey)) {
      // Validate the chip data when it loses focus
      const { isValid, chipColor } = validateChip({
        key: currentKey,
        value: currentValue,
        operator: currentOperator,
        modifier: currentModifier,
      });

      if (forcePalette) {
        setColors(getChipPalette(palette));
      } else if (!isValid) {
        setColors(getChipPalette("orange"));
      } else {
        setColors(getChipPalette(chipColor || palette));
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

  let valueTitle = currentKey;
  valueTitle = (
    <>
      {currentModifier !== "value" && (
        <i style={{ opacity: 0.75, paddingRight: "0.5rem" }}>
          {currentModifier.toUpperCase()}
        </i>
      )}
      <span style={{ fontSize: "1.33em" }}>
        <b>{currentKey}</b>
        <i style={{ opacity: 0.75, padding: "0 0.5rem" }}>
          {currentOperator || ""}
        </i>
      </span>
    </>
  );

  const validKeys = validation.validKeys();

  let { component: errorComponent } = validationError || {};
  return (
    <ClickAwayListener onClickAway={handleClickAway}>
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
          id={chipId}
          onClick={(event) => {
            handleChipClick(event, { x: 30, y: 0 });
          }}
          label={
            <Box
              sx={{
                textAlign: "center",
                padding: "8px 12px",
                position: "relative",
                overflow: "visible",
                marginLeft: "1em",
                paddingRight: 0,
              }}
              onClick={(event) => {
                handleChipClick(event, { x: 0, y: 8 });
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
                  <Tooltip
                    title={
                      <span>
                        <div>
                          {validation.getModifierDescription(currentModifier)}
                        </div>
                        <span>(click to change)</span>
                      </span>
                    }
                    enterDelay={750}
                    enterNextDelay={750}
                    arrow
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      {currentModifier == "value" ? "" : currentModifier}
                    </span>
                  </Tooltip>
                  {errorComponent == "modifier" && (
                    <span
                      style={{
                        position: "absolute",

                        right: "1em",
                        bottom: "0.75em",
                        display: "block",
                        overflow: "visible",
                        transform: "rotate(180deg)",
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
                description={validKeys.descriptions[currentKey]}
                onChange={handleKeyChange}
                onBlur={handleKeyBlur}
                backgroundColor={backgroundColor}
                highlightColor={lightColor}
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
                  opacity:
                    currentValue || (currentValue == 0 && currentValue !== "")
                      ? 1
                      : 0.5,
                  marginRight: "1em",
                }}
              >
                {currentOperator !== null && (
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
                      marginTop: "5.5px",
                    }}
                    onClick={handleSymbolClick}
                  >
                    <Tooltip
                      key={operator}
                      title={
                        <span>
                          <div>
                            {validation.getOperatorDescription(currentOperator)}
                          </div>
                          <span>(click to change)</span>
                        </span>
                      }
                      enterDelay={750}
                      enterNextDelay={750}
                      arrow
                    >
                      <span>{currentOperator}</span>
                    </Tooltip>

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

                <EditableText
                  title={valueTitle}
                  value={currentValue}
                  allowMultipleValues={validation.allowMultipleValues({
                    key: currentKey,
                    modifier: currentModifier,
                  })}
                  isNegatable={validation.isNegatable({
                    key: currentKey,
                    modifier: currentModifier,
                  })}
                  handleSplitValues={(e) =>
                    handleSplitValues(e, {
                      value: currentValue,
                    })
                  }
                  isAlreadyEditing={isEditingValue}
                  onChange={(newValue) => handleValueChange(newValue)}
                  onBlur={handleValueBlur}
                  backgroundColor={backgroundColor}
                  highlightColor={lightColor}
                  textColor={"black"}
                  anchorEl={anchorElValue}
                  setAnchorEl={setAnchorElValue}
                  valueAsChips={true}
                  maxWidth={500}
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
                  options={[
                    ...(validation.validValues({
                      key: currentKey,
                      modifier: currentModifier,
                    }) || []),
                  ]}
                  variant="body3"
                  sx={{
                    whiteSpace:
                      currentValue?.length > 100 ? "normal" : "nowrap",
                    wordBreak:
                      currentValue?.length > 100 ? "break-word" : "normal",
                    opacity:
                      (currentValue || currentValue == 0) &&
                      !isEditingValue &&
                      !anchorElValue
                        ? 1
                        : 0.5,
                    fontStyle: currentValue ? "normal" : "italic",
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
            "& .MuiChip-label": {
              display: "block",
              padding: "1em",
            },
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
            <Tooltip
              key={operator}
              title={validation.getOperatorDescription(operator)}
              enterDelay={750}
              enterNextDelay={750}
              arrow
            >
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
            </Tooltip>
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
            <Tooltip
              key={modifier}
              title={validation.getModifierDescription(modifier)}
              enterDelay={750}
              enterNextDelay={750}
              arrow
            >
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
            </Tooltip>
          ))}
        </Menu>
      </Box>
    </ClickAwayListener>
  );
};

export default KeyValueChip;
