import React, { useState } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";

const ValueChips = ({
  value = "",
  maxChips = 5,
  handleChange,
  backgroundColor,
  textColor,
  ...props
}) => {
  const [expanded, setExpanded] = useState(false);

  // Split the value into an array of values
  const values = value
    .split(/\s*,\s*/)
    .map((v) => v.trim())
    .filter((v) => v);

  // Handle deleting a chip
  const handleDelete = (chip) => {
    const newValues = values.filter((v) => v !== chip);
    handleChange?.(newValues.join(",")); // Pass the updated string to the parent
  };

  // Handle expanding the chips
  const handleExpand = () => {
    setExpanded(true);
  };

  // Determine which chips to display
  let visibleChips = expanded ? values : values.slice(0, maxChips);
  if (visibleChips.length == 0) {
    visibleChips = [null];
  }
  const hiddenCount = values.length - maxChips;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,

        // "& .MuiChip-root": {

        // },
      }}
      {...props}
    >
      {visibleChips.map((chip, index) => (
        <Chip
          key={index}
          label={chip}
          {...(chip !== null && { onDelete: () => handleDelete(chip) })}
          size="small"
          sx={{
            ...(backgroundColor && { backgroundColor }),
            ...(textColor && { color: textColor }),
            marginTop: "-2px",
            marginRight: "-6px",
            cursor: "pointer",
            height: "24px",
            lineHeight: "24px",
            fontSize: "0.875rem",
            maxWidth: "none",
            fontFamily: "'Roboto', 'Arial', sans-serif",
            display: "flex",
            justifyContent: "center", // Center the content horizontally
            alignItems: "center", // Vertically center content
            "& .MuiChip-deleteIcon": {
              color: textColor || "inherit",
              opacity: 0.5,
              fontSize: "1rem", // Set a consistent size for the delete icon
              marginRight: "4px",
              opacity: 0.5,
            },
            "& .MuiChip-label": {
              padding: "0 0.5em 0 0.75em",
            },
          }}
        />
      ))}
      {!expanded && hiddenCount > 0 && (
        <Chip
          label={`+${hiddenCount}`}
          onClick={handleExpand}
          sx={{ cursor: "pointer", backgroundColor: "#e0e0e0" }}
        />
      )}
    </Box>
  );
};

export default ValueChips;
