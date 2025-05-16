import React, { useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircleIcon from "@mui/icons-material/Circle";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import stringLength from "../../functions/stringLength";

const ValueChips = ({
  value = "",
  maxChips = 5,
  maxWidth = 1000,
  handleChange,
  title = "All Values",
  backgroundColor,
  textColor,
  isNegatable,
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
  const toggleExpand = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setExpanded((prev) => !prev);
  };

  const toggleNegate = ({ chip, negate }) => {
    const chipIndex = values.indexOf(chip);
    if (chipIndex !== -1) {
      const newValues = [...values];
      if (negate) {
        newValues[chipIndex] = chip.replace(/^!/, "");
      } else {
        newValues[chipIndex] = `!${chip}`;
      }
      handleChange?.(newValues.join(","));
    }
  };

  const setChipIcon = ({ negate, chip }) => {
    if (isNegatable && chip !== null) {
      if (negate) {
        return (
          <RemoveCircleIcon
            sx={{}}
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              toggleNegate({ chip, negate });
            }}
          />
        );
      } else if (chip !== null) {
        return (
          <CircleIcon
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              toggleNegate({ chip, negate });
            }}
            sx={{ opacity: 0.25 }}
          />
        );
      }
    }
    return null;
  };

  // Determine which chips to display
  let visibleChips = values.slice(0, maxChips);
  let fittingChips = maxChips;
  if (visibleChips.length === 0) {
    visibleChips = [null];
  } else {
    let chipsWidth = 0;
    for (let i = 0; i < visibleChips.length; i++) {
      let chip = visibleChips[i];
      const chipWidth = stringLength(chip, { factor: 9 }) + 40; // Estimate width based on character count
      chipsWidth += chipWidth;

      if (chipsWidth > maxWidth) {
        fittingChips = Math.max(i, 1);
        visibleChips = values.slice(0, fittingChips);
        break;
      }
    }
  }
  const hiddenCount = values.length - fittingChips;

  const chipStyle = {
    ...(backgroundColor && { backgroundColor }),
    ...(textColor && { color: textColor }),
    marginTop: "-2px",
    cursor: "pointer",
    height: "24px",
    lineHeight: "24px",
    fontSize: "0.875rem",
    maxWidth: `${maxWidth}px`,
    overflow: "hidden",
    whiteSpace: "nowrap",
    fontFamily: "'Roboto', 'Arial', sans-serif",
    display: "flex",
    justifyContent: "center", // Center the content horizontally
    alignItems: "center", // Vertically center content
    "& .MuiChip-deleteIcon": {
      color: textColor || "inherit",
      opacity: 0.5,
      fontSize: "1rem", // Set a consistent size for the delete icon
    },
    "& .MuiChip-label": {
      padding: "0 0.5em 0 0.5em",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    "& .MuiChip-icon": {
      color: textColor || "inherit",
      fontSize: "1rem",
    },
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
        }}
        {...props}
      >
        {visibleChips.map((chip, index) => {
          let negate = false;
          let chipLabel = chip === null ? "value" : chip;
          if (chipLabel.startsWith("!")) {
            negate = true;
            chipLabel = chipLabel.slice(1);
          }
          return (
            <Chip
              key={index}
              label={chipLabel}
              icon={setChipIcon({ negate, chip })}
              {...(chip !== null && { onDelete: () => handleDelete(chip) })}
              size="small"
              sx={chipStyle}
            />
          );
        })}
        {hiddenCount > 0 && (
          <Chip
            label={`+${hiddenCount}`}
            onClick={toggleExpand}
            sx={{
              cursor: "pointer",
              ...(backgroundColor && { backgroundColor }),
              ...(textColor && { color: textColor }),
              marginTop: "-2px",
              cursor: "pointer",
              height: "24px",
              lineHeight: "24px",
              fontSize: "0.875rem",
              maxWidth: "none",
              fontFamily: "'Roboto', 'Arial', sans-serif",
              "& .MuiChip-label": {
                padding: "0 0.5em 0 0.5em",
              },
            }}
          />
        )}
      </Box>

      {/* Modal to display all chips */}
      <Dialog open={expanded} onClose={toggleExpand} fullWidth maxWidth="md">
        <DialogTitle
          sx={{
            backgroundColor: backgroundColor || "primary.main",
            color: textColor || "white",
            fontSize: "1.25rem",
            fontWeight: "bold",
            padding: "1em",
            textAlign: "center",
            "& .MuiDialogTitle-root": {
              padding: "0.5em 1em",
            },
          }}
        >
          {title}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center", // Center horizontally
              alignItems: "center", // Center vertically
              paddingTop: "0.5em",
              gap: 1,
              height: "100%", // Ensure the Box takes the full height of the DialogContent
            }}
          >
            {values.map((chip, index) => {
              let negate = false;
              let chipLabel = chip === null ? "value" : chip;
              if (chipLabel.startsWith("!")) {
                negate = true;
                chipLabel = chipLabel.slice(1);
              }
              return (
                <Chip
                  key={index}
                  label={chipLabel}
                  icon={setChipIcon({ negate, chip })}
                  {...(chip !== null && { onDelete: () => handleDelete(chip) })}
                  size="small"
                  sx={{
                    ...chipStyle,
                    height: "auto",
                    whiteSpace: "normal", // Allow text to wrap
                    // overflow: "hidden", // Prevent overflow
                    wordBreak: "break-word", // Break long words to wrap properly
                    minHeight: "24px", // Set a minimum height for the chip
                    lineHeight: "1.2", // Adjust line height for multi-line text
                    maxWidth: "100%", // Allow the chip to take full width
                    "& .MuiChip-label": {
                      padding: "0.25em 0.5em 0.25em 0.5em",
                      whiteSpace: "normal", // Allow text to wrap
                      wordBreak: "break-word", // Break long words
                      textAlign: "left", // Center-align the text
                    },
                  }}
                />
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={toggleExpand}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ValueChips;
