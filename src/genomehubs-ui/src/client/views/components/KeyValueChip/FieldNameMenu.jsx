import React, { useState } from "react";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

export const FieldNameMenu = ({
  menuAnchorEl,
  handleMenuClose,
  validKeys,
  handleMenuSelect,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);

  // Helper to get group order, with 'primary' first
  const groupOrder = [
    "primary",
    ...Object.keys(validKeys.keysByGroup)
      .filter((g) => g !== "primary")
      .sort((a, b) => a.localeCompare(b)),
  ];

  const MoreMenuItem = ({ lastItem = false }) => (
    <MenuItem
      divider={!lastItem}
      sx={{ fontStyle: "italic", color: "text.secondary" }}
      onClick={() => setShowAll(!showAll)}
    >
      ...{showAll ? "Show Less" : "Show All"}
    </MenuItem>
  );

  const primaryKeys = [...validKeys.keysByGroup.primary];
  return (
    <Menu
      anchorEl={menuAnchorEl}
      open={Boolean(menuAnchorEl)}
      onClose={() => {
        setShowAll(false);
        setExpandedGroup(null);
        handleMenuClose();
      }}
      slotProps={{
        paper: {
          sx: {
            fontSize: "1.25em",
            minWidth: showAll ? 320 : undefined,
          },
        },
      }}
    >
      {showAll
        ? [
            <MoreMenuItem key="more-top" />,
            ...groupOrder.flatMap((group) => [
              <MenuItem
                key={`group-${group}`}
                onClick={() =>
                  setExpandedGroup(expandedGroup === group ? null : group)
                }
                divider
                sx={{
                  fontWeight: "bold",
                  pl: 2,
                  background:
                    expandedGroup === group ? "action.selected" : undefined,
                }}
              >
                {expandedGroup === group ? (
                  <span style={{ marginRight: 8 }}>
                    <span role="img" aria-label="Collapse">
                      <KeyboardArrowUpIcon sx={{ verticalAlign: "middle" }} />
                    </span>
                  </span>
                ) : (
                  <span style={{ marginRight: 8 }}>
                    <span role="img" aria-label="Expand">
                      <KeyboardArrowDownIcon sx={{ verticalAlign: "middle" }} />
                    </span>
                  </span>
                )}
                {group}
              </MenuItem>,
              ...(expandedGroup === group
                ? [...validKeys.keysByGroup[group]]
                    .sort((a, b) => a.localeCompare(b))
                    .map((key) => {
                      let value = key;
                      if (key === "collate") {
                        value = "collate(sequence_id,name)";
                      } else if (key.startsWith("tax_")) {
                        value = `${key}()`;
                      }
                      return (
                        <MenuItem
                          key={group + "_" + key}
                          sx={{ pl: 4 }}
                          onClick={() => {
                            handleMenuSelect(value);
                            setShowAll(false);
                            setExpandedGroup(null);
                          }}
                        >
                          {key}
                        </MenuItem>
                      );
                    })
                : []),
            ]),
            <MoreMenuItem key="more-bottom" lastItem />,
          ]
        : [
            <MoreMenuItem key="more-top" />,
            ...primaryKeys.map((key, index) => {
              let value = key;
              if (key === "collate") {
                value = "collate(sequence_id,name)";
              } else if (key.startsWith("tax_")) {
                value = `${key}()`;
              }
              return (
                <MenuItem
                  key={key}
                  divider={index == primaryKeys.length - 1}
                  onClick={() => handleMenuSelect(value)}
                >
                  {key}
                </MenuItem>
              );
            }),
            <MoreMenuItem key="more-bottom" lastItem />,
          ]}
    </Menu>
  );
};
