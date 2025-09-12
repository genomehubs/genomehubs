import React, { useEffect, useRef, useState } from "react";

import AutoCompleteOption from "./AutoCompleteOption";
import AutoCompleteSuggestion from "./AutoCompleteSuggestion";
import Autocomplete from "@mui/material/Autocomplete";
import AutowidthTextField from "../AutowidthTextField";
import Box from "@mui/material/Box";
import CancelIcon from "@mui/icons-material/Cancel";
import Chip from "@mui/material/Chip";
import JoinFullRoundedIcon from "@mui/icons-material/JoinFullRounded";
import JoinInnerRoundedIcon from "@mui/icons-material/JoinInnerRounded";
import Popper from "@mui/material/Popper";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import TextField from "@mui/material/TextField";
import Tooltip from "../Tooltip";
import Typography from "@mui/material/Typography";
import ValueChips from "./ValueChips";
import { setLookupTerm } from "../../reducers/lookup";
import stringLength from "../../functions/stringLength";

const checkContrast = (color, background, threshold = 4.5) => {
  const hexToRgb = (hex) => {
    let bigint = parseInt(hex.slice(1), 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return [r, g, b];
  };

  let fg = hexToRgb(color);
  let bg = hexToRgb(background);
  let fgLum = 0.2126 * fg[0] + 0.7152 * fg[1] + 0.0722 * fg[2];
  let bgLum = 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2];
  let contrast =
    fgLum > bgLum
      ? (fgLum + 0.05) / (bgLum + 0.05)
      : (bgLum + 0.05) / (fgLum + 0.05);
  return contrast >= threshold;
};

const getContrastColor = (color) => {
  // contrast color will either be "#31323f" or "#ffffff"
  return checkContrast(color, "#31323f") ? "#31323f" : "#ffffff";
};

const EditableText = ({
  title,
  value,
  description,
  options = [],
  valueTips,
  allowMultipleValues,
  isNegatable,
  isAlreadyEditing,
  onChange,
  onBlur,
  handleSplitValues,
  backgroundColor,
  textColor,
  highlightColor,
  anchorEl,
  setAnchorEl,
  startComponent,
  endComponent,
  valueAsChips,
  maxWidth = 250,
  handleLookup,
  sx,
  ...props
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [cursorPos, setCursorPos] = useState(0);

  const rootRef = useRef(null);

  const contrastColor = getContrastColor(backgroundColor);
  const highlightContrastColor = getContrastColor(highlightColor);

  useEffect(() => {
    if (isAlreadyEditing) {
      setIsEditing(true);
      setAnchorEl(rootRef.current);
    }
  }, [isAlreadyEditing]);

  const [dynamicOptions, setDynamicOptions] = useState([]);
  const [lookupTerm, setLookupTerm] = useState(inputValue);

  const handleEdit = (event) => {
    setIsEditing(true);
    setAnchorEl(event.currentTarget);
  };

  const handleBlur = (event) => {
    setIsEditing(false);
    setAnchorEl(null);
    onChange?.(inputValue); // Pass the array of values to the parent
    onBlur?.(event);
  };

  const handleChange = (newValue) => {
    setInputValue(`${newValue}`);
    setIsEditing(false);
    setAnchorEl(null);
    onChange?.(`${newValue}`);
  };

  const valueMap = (inputValue || "").split(/\s*,\s*/).reduce((acc, curr) => {
    const parts = curr.split(/[\[\]]/);
    acc[parts[0]] = curr;
    return acc;
  }, {});

  const reverseValueMap = Object.fromEntries(
    Object.entries(valueMap).map(([key, val]) => [val, key]),
  );

  let inputProps = {
    size: "small",
    variant: "standard",
    autoFocus: true,
    sx: {
      maxWidth,
      "& .MuiInputBase-input": {
        textAlign: "center",
      },
      "& .MuiInputBase-root": {
        backgroundColor: backgroundColor,
        color: contrastColor,
      },
    },
  };

  let textInput = null;

  const shortenValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "";
    }
    if (typeof value === "string") {
      const parts = value.split(/\s*,\s*/);
      for (let i = 0; i < parts.length; i++) {
        parts[i] = reverseValueMap[parts[i]] || parts[i];
      }
      return parts.join(",");
    }
    if (Array.isArray(value)) {
      return value.map((v) => reverseValueMap[v] || v).join(",");
    }
    return valueMap[value] || value;
  };

  const extendValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "";
    }
    if (typeof value === "string") {
      const parts = value.split(/\s*,\s*/);
      for (let i = 0; i < parts.length; i++) {
        parts[i] = valueMap[parts[i]] || parts[i];
      }
      return parts.join(",");
    }
    if (Array.isArray(value)) {
      return value.map((v) => valueMap[v] || v).join(",");
    }
    return valueMap[value] || value;
  };

  if (options && options.length > 0) {
    let minWidth = options.reduce(
      (max, option) =>
        Math.max(max, stringLength(option, { factor: 10 }) + 2 * 4),
      0,
    );
    minWidth = `${Math.max(minWidth, 100)}px`; // Ensure a minimum width
    textInput = (
      <Autocomplete
        multiple={allowMultipleValues}
        disablePortal={true}
        autoHighlight // experimenting
        options={options}
        value={
          allowMultipleValues
            ? (inputValue || "").split(/\s*,\s*/).filter((v) => v)
            : inputValue
        }
        onChange={(event, newValue) => {
          if (event && event.preventDefault) {
            event.preventDefault();
          }
          const updatedValue = allowMultipleValues
            ? newValue.join(",")
            : newValue;
          handleChange(updatedValue);
        }}
        onBlur={handleBlur}
        renderTags={(value, getTagProps) => {
          return null; // Don't render tags in the input field
        }}
        disableClearable
        renderInput={(params) => (
          <TextField
            {...params}
            {...inputProps}
            autoComplete="off"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsEditing(false);
                setAnchorEl(null);
              } else if (event.key === "Enter") {
                const updatedValue = event.target.value;
                const matchedOption = options.find(
                  (opt) => opt === updatedValue,
                );
                if (matchedOption) {
                  handleChange(updatedValue);
                } else if (options.length > 0) {
                  const filteredOptions = options.filter((opt) =>
                    opt.toLowerCase().match(event.target.value.toLowerCase()),
                  );
                  handleChange(filteredOptions[0] || options[0]);
                } else {
                  handleChange(updatedValue);
                }
              }
            }}
            value={inputValue || ""}
            placeholder="Type values separated by commas..."
            sx={{
              ...inputProps.sx,
              minWidth,
              "& .MuiAutocomplete-popupIndicator": {
                display: "none",
                pointerEvents: "none",
                fontSize: "0",
              },
              "& .MuiAutocomplete-inputRoot": {
                paddingRight: "0px !important",
              },
            }}
          />
        )}
        renderOption={(props, option) => {
          return <AutoCompleteOption option={option} {...props} />;
        }}
        slotProps={{
          popper: {
            sx: {
              [`& .MuiAutocomplete-noOptions`]: {
                display: "none",
              },
            },
          },
        }}
      />
    );
  } else if (handleLookup && handleLookup !== null) {
    let minWidth = "300px"; // Default minimum width
    useEffect(() => {
      let isMounted = true;
      if (
        handleLookup &&
        lookupTerm !== undefined &&
        lookupTerm !== null &&
        lookupTerm.length > 2
      ) {
        const lookupResult = handleLookup(lookupTerm);
        if (lookupResult instanceof Promise) {
          lookupResult.then((options) => {
            if (isMounted) {
              setDynamicOptions(options || []);
            }
          });
        } else {
          setDynamicOptions(lookupResult || []);
        }
      } else {
        setDynamicOptions([]);
      }
      return () => {
        isMounted = false;
      };
    }, [lookupTerm, handleLookup]);

    // Helper to find the current editing segment in a comma-separated string
    const getCurrentSegment = (value, cursorPos) => {
      // Find the start and end of the segment based on cursor position
      let start = value.lastIndexOf(",", cursorPos - 1) + 1;
      let end = value.indexOf(",", cursorPos);
      if (end === -1) {
        end = value.length;
      }
      return value.slice(start, end).trim();
    };

    textInput = (
      <Autocomplete
        multiple={allowMultipleValues}
        freeSolo
        autoHighlight
        options={dynamicOptions}
        inputValue={shortenValue(inputValue)}
        onInputChange={(event, newInputValue, reason) => {
          // Only update lookupTerm on typing, not on selection
          if (reason === "input") {
            setLookupTerm(newInputValue);
            setInputValue(newInputValue);
          }
        }}
        filterOptions={(x) => x}
        getOptionLabel={(option) =>
          typeof option === "string" ? option : option.title
        }
        isOptionEqualToValue={(option, value) => {
          let val = value.title || value;
          if (option.matchTerm) {
            return option.matchTerm === val;
          }
          return option.title === val;
        }}
        value={
          allowMultipleValues
            ? Array.from(
                new Set((inputValue || "").split(/\s*,\s*/).filter((v) => v)),
              )
            : inputValue
        }
        onChange={(event, newValue, reason) => {
          if (allowMultipleValues) {
            let values = Array.isArray(newValue)
              ? newValue.flatMap((v) =>
                  (v.string || v)
                    .split(/\s*,\s*/)
                    .map((s) => s.trim())
                    .filter((s) => s),
                )
              : [];
            // If user selected from dropdown, replace the last segment with selected value
            if (reason === "selectOption" && values.length > 1) {
              // Replace the last segment (partial term) with the selected value
              // Replace the segment being edited with the selected value
              const fullInput = shortenValue(inputValue || "");
              const segments = fullInput.split(/\s*,\s*/);
              const editedIndex = segments.findIndex((seg, idx) => {
                const segStart =
                  idx === 0
                    ? 0
                    : fullInput.indexOf(
                        segments[idx],
                        fullInput.indexOf(segments[idx - 1]) +
                          segments[idx - 1].length +
                          1,
                      );
                const segEnd = segStart + seg.length;
                return cursorPos >= segStart && cursorPos <= segEnd;
              });
              if (editedIndex !== -1) {
                segments[editedIndex] = values[values.length - 1];
                values = segments;
              }
            } else if (reason === "removeOption") {
              // Add the lookupTerm to the list
              values = [...values, lookupTerm];
            }
            // Remove duplicates
            const deduped = Array.from(
              new Set(values.map((v) => extendValue(v))),
            );
            const updatedValue = extendValue(deduped.join(","));
            setInputValue(updatedValue);
            onChange?.(updatedValue);
          } else {
            const updatedValue =
              typeof newValue === "string"
                ? extendValue(newValue)
                : extendValue(newValue.string || newValue.title) || "";
            setInputValue(updatedValue);
            onChange?.(updatedValue);
          }
        }}
        onBlur={handleBlur}
        renderTags={(value, getTagProps) => {
          return null;
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            {...inputProps}
            onChange={(event) => {
              const fullValue = event.target.value;
              const currentCursorPos = event.target.selectionStart;
              setCursorPos(currentCursorPos);
              // Find the current segment being edited
              const currentSegment = getCurrentSegment(
                fullValue,
                currentCursorPos,
              );
              setInputValue(extendValue(fullValue));
              setLookupTerm(currentSegment);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsEditing(false);
                setAnchorEl(null);
              } else if (event.key === " ") {
                event.stopPropagation();
                event.preventDefault();

                // add space at the current cursor position
                const fullValue = event.target.value;
                const currentCursorPos = event.target.selectionStart;
                const beforeCursor = fullValue.slice(0, currentCursorPos);
                const afterCursor = fullValue.slice(currentCursorPos);
                const newValue = beforeCursor + "_" + afterCursor;
                setInputValue(extendValue(newValue));

                // Move cursor after the inserted "_"
                // Wait for the value to update, then set selection
                setTimeout(() => {
                  if (event.target.setSelectionRange) {
                    event.target.setSelectionRange(
                      currentCursorPos + 1,
                      currentCursorPos + 1,
                    );
                  }
                }, 0);
              }
            }}
            value={shortenValue(inputValue)}
            placeholder="Type values separated by commas..."
            sx={{
              ...inputProps.sx,
              minWidth,
            }}
          />
        )}
        renderOption={(props, option) => {
          if (option.highlighted) {
            return <AutoCompleteSuggestion option={option} {...props} />;
          }
          return <AutoCompleteOption option={option} {...props} />;
        }}
        slotProps={{
          popper: {
            sx: {
              [`& .MuiAutocomplete-noOptions`]: {
                display: "none",
              },
            },
          },
        }}
      />
    );
  } else {
    textInput = (
      <AutowidthTextField
        value={inputValue || ""} // Display as a comma-separated string
        handleChange={handleChange}
        onBlur={(event) => handleChange(event.target.value)}
        maxWidth={maxWidth}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsEditing(false);
            setAnchorEl(null);
          } else if (event.key === "Enter") {
            handleChange(event.target.value);
          }
        }}
        {...inputProps}
      />
    );
  }

  let displayValue = valueAsChips ? (
    <ValueChips
      title={title}
      value={inputValue || ""}
      valueTips={valueTips}
      handleChange={handleChange}
      backgroundColor={backgroundColor}
      allowMultipleValues={allowMultipleValues}
      textColor={contrastColor}
      isNegatable={isNegatable}
      maxWidth={maxWidth}
      maxChips={5}
      endAdornment={
        handleSplitValues ? (
          <Tooltip
            title="Values in a single chip will be joined with OR. Click to split into multiple chips."
            placement="top"
            arrow
          >
            <JoinFullRoundedIcon
              sx={{ color: backgroundColor, marginTop: "-2px" }}
              onClick={handleSplitValues}
            />
          </Tooltip>
        ) : null
      }
    />
  ) : (
    inputValue
  );

  return (
    <>
      <Typography
        ref={rootRef}
        sx={{
          cursor: "pointer",
          color: textColor,
          opacity: isEditing ? 0.5 : 1,
          whiteSpace: "nowrap",
          display: "inline-flex",
          alignItems: "center",
          // paddingRight: "1em",
          ...sx,
        }}
        onClick={handleEdit}
        {...props}
      >
        {startComponent}
        <Tooltip
          title={description}
          placement="top"
          enterDelay={750}
          enterNextDelay={750}
          arrow
        >
          <Box component="span" sx={{ whiteSpace: "nowrap" }}>
            {displayValue}
          </Box>
        </Tooltip>
        {endComponent}
      </Typography>
      {isEditing && (
        <Popper
          open={isEditing}
          anchorEl={anchorEl}
          placement="bottom"
          sx={{
            zIndex: 1000, // Ensure it appears above other elements
          }}
        >
          <Box
            sx={{
              padding: "8px",
              backgroundColor: backgroundColor,
              color: textColor,
              borderRadius: "4px",
              boxShadow:
                "0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)",
            }}
          >
            {textInput}
          </Box>
        </Popper>
      )}
    </>
  );
};

export default EditableText;
