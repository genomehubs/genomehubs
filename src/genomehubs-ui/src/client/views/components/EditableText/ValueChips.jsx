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
    maxWidth: "none",
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
      <Dialog open={expanded} onClose={toggleExpand} fullWidth maxWidth="sm">
        <DialogTitle>All Values</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
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
                  sx={chipStyle}
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
