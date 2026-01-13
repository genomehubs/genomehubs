import React, { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import stringLength from "#functions/stringLength";

const AutowidthTextField = ({
  value = "",
  padding = 16,
  minWidth = 100,
  maxWidth = 900,
  fontSize = 16,
  handleChange,
  ...props
}) => {
  const calculateWidth = (value) => {
    const factor = fontSize * 0.5;
    const width = stringLength(value, { factor }) + 2 * padding;
    return Math.min(maxWidth, Math.max(minWidth, width));
  };

  const [inputValue, setInputValue] = useState(value);
  const [inputWidth, setInputWidth] = useState(calculateWidth(value));

  // Update the width whenever the value changes
  useEffect(() => {
    setInputWidth(calculateWidth(inputValue));
  }, [inputValue]);

  const handleBlur = () => {
    handleChange?.(inputValue); // Call handleChange on blur
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleChange?.(inputValue); // Call handleChange on Enter keypress
    }
  };

  return (
    <Box
      sx={{
        display: "inline-block",
        width: `${inputWidth}px`, // Dynamically set the width
        transition: "width 0.2s ease", // Smooth transition for width changes

        "& .MuiFormControl-root": {
          width: "100%",
        },
        "& .MuiInputBase-root": {
          width: "100%",
        },
        overflow: "visible",
      }}
    >
      <TextField
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)} // Update local state
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        slotProps={{
          input: {
            sx: {
              textAlign: "center",
              padding: `16.5 ${padding}`, // Add padding to the input
              fontSize: `${fontSize}px`, // Set font size
              width: "100%", // Make the input take full width
            },
          },
        }}
        {...props} // Pass additional props to TextField
      />
    </Box>
  );
};

export default AutowidthTextField;
