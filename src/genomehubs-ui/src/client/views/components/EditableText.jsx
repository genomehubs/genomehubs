import React, { useState } from "react";

import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import ErrorIcon from "@mui/icons-material/Error";
import Popper from "@mui/material/Popper";
import TextField from "@mui/material/TextField";
import Tooltip from "./Tooltip";
import Typography from "@mui/material/Typography";
import { set } from "core-js/core/dict";

const EditableText = ({
  value,
  options = [],
  onChange,
  onBlur,
  backgroundColor,
  textColor,
  anchorEl,
  setAnchorEl,
  startComponent,
  endComponent,
  sx,
  ...props
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const handleEdit = (event) => {
    setIsEditing(true);
    setAnchorEl(event.currentTarget);
  };

  const handleBlur = (event) => {
    setIsEditing(false);
    setAnchorEl(null);
    // setInputValue(value);
    onBlur?.(event);
  };

  const handleChange = (newValue) => {
    setInputValue(newValue);
  };

  let inputProps = {
    size: "small",
    variant: "standard",
    autoFocus: true,
    sx: {
      marginTop: "4px",
      width: `${Math.max(value.length, 12) * 12 + 40}px`,
      "& .MuiInputBase-input": {
        textAlign: "center",
      },
      "& .MuiInputBase-root": {
        backgroundColor: backgroundColor,
        color: textColor,
        borderRadius: "4px",
        padding: "0 2px 2px 2px",
      },
    },
  };
  let textInput = null;

  if (options && options.length > 0) {
    textInput = (
      <Autocomplete
        options={options}
        value={inputValue}
        onChange={(event, newValue) => handleChange(newValue || "")}
        onBlur={(event) => {
          handleBlur(event);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onChange?.(inputValue || "");
            setIsEditing(false);
            setAnchorEl(null);
          }
        }}
        onHighlightChange={(event, option, reason) => {
          setInputValue(option || "");
        }}
        renderInput={(params) => <TextField {...params} {...inputProps} />}
      />
    );
  } else {
    textInput = (
      <TextField
        value={inputValue}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onChange?.(inputValue);
            setIsEditing(false);
            setAnchorEl(null);
          }
        }}
        {...inputProps}
      />
    );
  }

  return (
    <>
      <Typography
        sx={{
          cursor: "pointer",
          color: textColor,
          opacity: isEditing ? 0.5 : 1,
          ...sx,
        }}
        onClick={handleEdit}
        {...props}
      >
        {startComponent}
        {value}
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
