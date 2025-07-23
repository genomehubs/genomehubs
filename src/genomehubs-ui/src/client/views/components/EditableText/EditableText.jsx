import React, { useEffect, useRef, useState } from "react";

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
  sx,
  ...props
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const rootRef = useRef(null);

  const contrastColor = getContrastColor(backgroundColor);
  const highlightContrastColor = getContrastColor(highlightColor);

  useEffect(() => {
    if (isAlreadyEditing) {
      setIsEditing(true);
      setAnchorEl(rootRef.current);
    }
  }, [isAlreadyEditing]);

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
    setInputValue(newValue);
    setIsEditing(false);
    setAnchorEl(null);
    onChange?.(newValue);
  };

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
        // freeSolo
        options={options}
        value={
          allowMultipleValues
            ? inputValue.split(/\s*,\s*/).filter((v) => v)
            : inputValue
        }
        onChange={(event, newValue) => {
          const updatedValue = allowMultipleValues
            ? newValue.join(",")
            : newValue; // Join the array back into a comma-separated string
          setInputValue(updatedValue);
          onChange?.(updatedValue); // Pass the array of values to the parent
        }}
        onBlur={handleBlur}
        renderTags={(value, getTagProps) => (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              width: "100%", // Ensure the chips take the full width
            }}
          >
            {value.map((option, index) => {
              const isNegated = option.startsWith("!");
              const label = isNegated ? option.slice(1) : option;

              return (
                <Chip
                  key={index}
                  label={label}
                  icon={
                    isNegated ? (
                      <RemoveCircleIcon
                        sx={{ fontSize: "1rem", color: "red" }}
                      />
                    ) : null
                  } // Add an icon if the value is negated
                  {...getTagProps({ index })}
                  sx={{
                    backgroundColor: highlightColor,
                    color: highlightContrastColor,

                    height: "24px",
                    lineHeight: "24px",
                    fontSize: "0.875rem",
                    maxWidth: "none",
                    fontFamily: "'Roboto', 'Arial', sans-serif",
                    display: "flex",
                    justifyContent: "center", // Center the content horizontally
                    alignItems: "center", // Vertically center content
                    "& .MuiChip-deleteIcon": {
                      color: highlightContrastColor || "inherit",
                      opacity: 0.5,
                      fontSize: "1rem", // Set a consistent size for the delete icon
                      marginRight: "4px",
                      opacity: 0.5,
                    },
                    "& .MuiChip-label": {
                      padding: "0 0.6em 0 0.65em",
                      color: highlightContrastColor,
                    },
                    "& .MuiChip-icon": {
                      color: highlightContrastColor || "inherit",
                      fontSize: "1rem",
                    },
                  }}
                />
              );
            })}
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            {...inputProps}
            onChange={(event) => {
              const updatedValue = allowMultipleValues
                ? event.target.value
                    .split(/\s*,\s*/)
                    .filter((v) => v)
                    .join(",")
                : event.target.value;

              // setInputValue(updatedValue);
              // setIsEditing(false);
              // setAnchorEl(null);
              // onChange?.(updatedValue); // Pass the array of values to the parent
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsEditing(false);
                setAnchorEl(null);
              } else if (event.key === "Enter") {
                handleChange(event.target.value);
              }
            }}
            value={inputValue || ""}
            placeholder="Type values separated by commas..."
            sx={{
              ...inputProps.sx,
              minWidth,
            }}
          />
        )}
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
              sx={{ color: backgroundColor }}
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
        <Popper open={isEditing} anchorEl={anchorEl} placement="bottom">
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
