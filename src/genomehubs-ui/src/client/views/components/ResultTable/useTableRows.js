import {
  OddTableCell,
  StickyCell,
  StyledTableRow,
  TableCell,
  darkColor,
  lightColor,
} from "./StyledComponents";

import AggregationIcon from "../AggregationIcon";
import FiberManualRecordSharpIcon from "@mui/icons-material/FiberManualRecordSharp";
import GetAppIcon from "@mui/icons-material/GetApp";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import RadioButtonCheckedOutlinedIcon from "@mui/icons-material/RadioButtonCheckedOutlined";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import Tooltip from "../Tooltip";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";

/**
 * Custom hook to build table rows from search results
 * Memoizes the result to prevent unnecessary recalculations
 */
export const useTableRows = ({
  searchResults = { results: [] },
  searchIndex,
  expandedTypes = [],
  expandColumns = {},
  constraints = {},
  activeNameClasses = {},
  activeRanks = {},
  statusColors = {},
  rootRef,
  setAttributeSettings,
  formatCellValue,
  setCellClassName,
  setColSpan,
  setLinkIcons,
  handleRecordClick,
  handleToggleColSpan,
}) => {
  const theme = useTheme();
  const headerBackgroundColor =
    theme.palette.mode === "dark"
      ? theme.palette.grey[800]
      : theme.palette.grey[200];
  const headerTextColor =
    theme.palette.mode === "dark"
      ? theme.palette.grey[100]
      : theme.palette.grey[900];

  return useMemo(() => {
    const rows = [];
    let lastGroup = null;

    // First pass: Add result rows with group headers
    searchResults.results.forEach((result, idx) => {
      // Add group header if this result is from a different msearch query
      if (
        searchResults.isMsearch &&
        result._msearchGroup &&
        lastGroup !== result._msearchGroup.queryIndex
      ) {
        lastGroup = result._msearchGroup.queryIndex;
        rows.push(
          <StyledTableRow
            key={`group-header-${result._msearchGroup.queryIndex}`}
            style={{
              backgroundColor: headerBackgroundColor,
              fontWeight: "bold",
              height: "32px",
            }}
          >
            <TableCell
              colSpan="100"
              style={{
                padding: "8px 16px",
                borderBottom: `2px solid ${theme.palette.divider}`,
                color: headerTextColor,
              }}
            >
              Results for: <em>{result._msearchGroup.query}</em>
            </TableCell>
          </StyledTableRow>,
        );
      }

      let name = result.result.scientific_name;
      let currentRecordId = result.result.taxon_id;
      if (
        result.result.taxon_rank == "species" ||
        result.result.taxon_rank == "subspecies"
      ) {
        name = <em>{name}</em>;
      }
      let cells = [
        <Tooltip title={"Click to view record"} arrow key={"name"}>
          <StickyCell
            style={{ cursor: "pointer" }}
            onClick={() => handleRecordClick(result.result)}
          >
            {name}
          </StickyCell>
        </Tooltip>,
        <Tooltip title={"Click to view record"} arrow key={"taxon_id"}>
          <TableCell
            style={{ cursor: "pointer" }}
            onClick={() => handleRecordClick(result.result)}
          >
            {result.result.taxon_id}
          </TableCell>
        </Tooltip>,
      ];

      Object.keys(activeNameClasses).forEach((nameClass) => {
        if (
          result.result.names &&
          result.result.names[nameClass] &&
          (result.result.names[nameClass].name ||
            result.result.names[nameClass].identifier)
        ) {
          let value =
            result.result.names[nameClass].name ||
            result.result.names[nameClass].identifier;
          value = formatCellValue({
            value,
            type: { summary: "value" },
            searchIndex,
            field: { value, length: value.length },
          });
          cells.push(
            <TableCell key={`name-${nameClass}`}>
              <span
                ref={rootRef}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setAttributeSettings({
                    currentRecordId,
                    attributeId: nameClass,
                    showAttribute: true,
                  });
                }}
              >
                {value}
              </span>
            </TableCell>,
          );
        } else {
          cells.push(<TableCell key={nameClass}>-</TableCell>);
        }
      });

      Object.keys(activeRanks).forEach((rank) => {
        if (
          result.result.ranks &&
          result.result.ranks[rank] &&
          result.result.ranks[rank].scientific_name
        ) {
          cells.push(
            <TableCell key={`rank-${rank}`}>
              {result.result.ranks[rank].scientific_name}
            </TableCell>,
          );
        } else {
          cells.push(<TableCell key={rank}>-</TableCell>);
        }
      });

      if (searchIndex == "assembly") {
        currentRecordId = result.result.assembly_id;
        cells.push(
          <Tooltip title={"Click to view record"} arrow key={"assembly_id"}>
            <TableCell
              style={{ cursor: "pointer" }}
              onClick={() => handleRecordClick(result.result)}
            >
              {result.result.assembly_id}
            </TableCell>
          </Tooltip>,
        );
      }

      if (searchIndex == "sample") {
        currentRecordId = result.result.sample_id;
        cells.push(
          <Tooltip title={"Click to view record"} arrow key={"sample_id"}>
            <TableCell
              style={{ cursor: "pointer" }}
              onClick={() => handleRecordClick(result.result)}
            >
              {result.result.sample_id}
            </TableCell>
          </Tooltip>,
        );
      }

      if (searchIndex == "feature") {
        currentRecordId = result.result.feature_id;
        cells = [];
        cells.push(
          <Tooltip title={"Click to view assembly"} arrow key={"assembly_id"}>
            <TableCell
              style={{ cursor: "pointer" }}
              onClick={() => handleRecordClick(result.result)}
            >
              {result.result.assembly_id}
            </TableCell>
          </Tooltip>,
        );
        cells.push(
          <Tooltip title={"Click to view feature"} arrow key={"feature_id"}>
            <TableCell
              style={{ cursor: "pointer" }}
              onClick={() => handleRecordClick(result.result)}
            >
              {result.result.feature_id}
            </TableCell>
          </Tooltip>,
        );
      }

      expandedTypes.forEach((type) => {
        let { fieldName, summary, colCount, colSpan } = setColSpan({
          type,
        });
        if (
          result.result.fields &&
          result.result.fields.hasOwnProperty(fieldName)
        ) {
          let field = result.result.fields[fieldName];
          if (!summary) {
            summary = Array.isArray(type.summary)
              ? type.summary[0]
              : type.summary;
          }
          let value, binnable;
          if (type.processed_type == "date") {
            if (summary == "min") {
              summary = "from";
            }
            if (summary == "max") {
              summary = "to";
            }
          }
          if (summary && field[summary]) {
            value = field[summary];
            binnable = summary == "value";
          } else if (
            field.aggregation_source &&
            ["ancestor", "descendant", "direct", "estimate"].includes(summary)
          ) {
            if (
              field.aggregation_source.includes(summary) ||
              (summary == "estimate" &&
                ["ancestor", "descendant"].includes(
                  field.aggregation_source[0],
                ))
            ) {
              value = field.value;
              binnable = true;
            } else {
              value = undefined;
            }
          } else {
            value = field.value;
            binnable = true;
          }
          // uncomment to use binned value if available
          value =
            binnable && field.hasOwnProperty("binned") ? field.binned : value;
          if (colSpan == 0) {
            value = formatCellValue({
              value,
              type,
              searchIndex,
              field,
            });
            let color;
            if (type.name != type.field && type.file_paths) {
              let [_, key] = (type.field || type.name).split(".");
              ({ color } = type.file_paths[key] || {});
            }
            cells.push(
              <TableCell
                key={`${type.name}_${type.summary}`}
                style={{
                  backgroundColor: `${type.color}${lightColor}`,
                }}
              >
                {typeof value != "undefined" && (
                  <Grid
                    container
                    direction="row"
                    wrap="nowrap"
                    spacing={1}
                    alignItems={"center"}
                    ref={rootRef}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setAttributeSettings({
                        currentRecordId,
                        attributeId: type.name,
                        showAttribute: true,
                      });
                    }}
                  >
                    {field.aggregation_source && (
                      <Grid>
                        <AggregationIcon
                          method={field.aggregation_source}
                          hasDescendants={field.has_descendants}
                        />
                      </Grid>
                    )}

                    <Grid
                      style={{
                        whiteSpace: "nowrap",
                        ...(color && { color }),
                      }}
                    >
                      {value}
                    </Grid>
                  </Grid>
                )}
              </TableCell>,
            );
          } else {
            let values;
            try {
              values = (Array.isArray(value) ? value : [value]).map((v) =>
                v.toLowerCase(),
              );
            } catch {
              values = [];
            }
            let added = new Set();
            let fieldConstraints =
              constraints[type.field.replace(/:.+$/, "")] || [];
            fieldConstraints.forEach((key, i) => {
              let lcKey = key.toLowerCase();
              let css = setCellClassName(
                i,
                fieldConstraints.length,
                expandColumns[type.field],
              );
              let color = type.color || type.file_paths?.[lcKey]?.color;

              if (!values.includes(lcKey)) {
                if (lcKey == "other" && values.length > added.size) {
                  let fill = statusColors[field.aggregation_source];

                  cells.push(
                    <OddTableCell
                      key={`${type.field}-${lcKey}-${i}`}
                      className={css}
                    >
                      <RadioButtonCheckedOutlinedIcon
                        style={{ fill, fontSize: "1.25rem" }}
                      />
                    </OddTableCell>,
                  );
                } else {
                  cells.push(
                    <OddTableCell
                      key={`${type.field}-${lcKey}-${i}`}
                      className={css}
                      style={{
                        backgroundColor: `${color}${
                          i % 2 == 0 ? lightColor : darkColor
                        }`,
                      }}
                    />,
                  );
                }
              } else {
                let linkIcons = setLinkIcons({ type, key: key, result });
                added.add(lcKey);
                let icons = [];
                let RadioIcon = FiberManualRecordSharpIcon;
                let fill = statusColors[field.aggregation_source];
                for (let linkIcon of linkIcons) {
                  let { title } = linkIcon;
                  if (linkIcon.color) {
                    fill = linkIcon.color;
                  }
                  let onClick = () => {};
                  if (linkIcon.icon) {
                    if (linkIcon.icon == "download") {
                      RadioIcon = GetAppIcon;
                    } else if (linkIcon.icon == "view") {
                      RadioIcon = VisibilityIcon;
                    }
                    onClick = (e) => {
                      e.stopPropagation();
                      window.open(linkIcon.url);
                    };
                  } else if (linkIcon.expand) {
                    if (!expandColumns[linkIcon.expand]) {
                      RadioIcon = RadioButtonUncheckedIcon;
                      title = "Click to expand column";
                    } else {
                      RadioIcon = RadioButtonCheckedOutlinedIcon;
                      title = "Click to collapse column";
                    }
                    onClick = (e) => {
                      e.stopPropagation();
                      handleToggleColSpan(
                        linkIcon.expand,
                        expandColumns[linkIcon.expand] ? 1 : 0,
                        true,
                      );
                    };
                  }
                  let icon = (
                    <RadioIcon
                      style={{
                        fill,
                        cursor: "pointer",
                        fontSize: "1.25rem",
                      }}
                      key={`file-${linkIcon.icon || ""}-${i}`}
                      onClick={onClick}
                    />
                  );
                  if (title) {
                    icon = (
                      <Tooltip
                        title={title}
                        arrow
                        position="top"
                        key={`file-${linkIcon.icon || ""}-${i}`}
                      >
                        {icon}
                      </Tooltip>
                    );
                  }
                  icons.push(icon);
                }
                if (!linkIcons || linkIcons.length == 0) {
                  icons.push(
                    <RadioIcon
                      style={{
                        fill,
                        cursor: "pointer",
                        fontSize: "1.25rem",
                      }}
                      key="check"
                    />,
                  );
                }
                cells.push(
                  <OddTableCell
                    key={`${type.field}-${lcKey}-${i}`}
                    style={{
                      whiteSpace: "nowrap",
                      backgroundColor: `${color}${
                        i % 2 == 0 ? lightColor : darkColor
                      }`,
                    }}
                    className={css}
                  >
                    {icons}
                  </OddTableCell>,
                );
              }
            });
          }
        } else {
          if (!colSpan) {
            colSpan = 0;
            colCount = 1;
          }
          for (let i = 0; i < colCount; i++) {
            let css = setCellClassName(i, colCount, expandColumns[type.field]);
            cells.push(
              <OddTableCell
                key={`${type.field || type.name}-${i}`}
                className={css}
              >
                {colSpan == 0 && "-"}
              </OddTableCell>,
            );
          }
        }
      });

      cells.push(
        <Tooltip title={"Click to view record"} arrow key={"go to record"}>
          <TableCell>
            <IconButton
              aria-label="go to record"
              size="small"
              onClick={() => handleRecordClick(result.result)}
            >
              <KeyboardArrowRightIcon />
            </IconButton>
          </TableCell>
        </Tooltip>,
      );

      rows.push(<StyledTableRow key={result.id}>{cells}</StyledTableRow>);
    });

    // Add group headers for queries with no results or errors
    if (searchResults.isMsearch && searchResults.queryGroups) {
      searchResults.queryGroups.forEach((group, groupIdx) => {
        // Check if this group's results were already added (has results)
        const hasAddedResults = searchResults.results.some(
          (r) => r._msearchGroup?.queryIndex === groupIdx,
        );

        if (!hasAddedResults) {
          // Add header for this group even though it has no results
          const isError = group.error || group.errorMessage;
          const backgroundColor = isError ? "#ffebee" : headerBackgroundColor; // Light red for errors
          const textColor = isError ? "#c62828" : headerTextColor;
          const headerText = isError
            ? `⚠ Error: ${group.query} - ${group.errorMessage}`
            : `No results for: ${group.query}`;

          rows.push(
            <StyledTableRow
              key={`group-header-${groupIdx}`}
              style={{
                backgroundColor,
                fontWeight: "bold",
                height: "32px",
              }}
            >
              <TableCell
                colSpan="100"
                style={{
                  padding: "8px 16px",
                  borderBottom: `2px solid ${theme.palette.divider}`,
                  color: textColor,
                }}
              >
                {headerText}
              </TableCell>
            </StyledTableRow>,
          );
        }
      });
    }

    // Add "Show more" rows for msearch groups that have more results than displayed
    // Iterate in reverse to avoid index shifting issues when inserting
    if (searchResults.isMsearch && searchResults.queryGroups) {
      // Build a map of group index to insertion info
      const insertions = [];
      let rowOffset = 0; // Track how many rows we've added so far

      searchResults.queryGroups.forEach((group, groupIdx) => {
        if (group.hasMore) {
          // Position: group header (1) + displayed results (group.count) + previous insertions
          const insertionIndex = group.startIndex + group.count + rowOffset + 1;
          insertions.push({
            index: insertionIndex,
            groupIdx,
            group,
          });
          rowOffset += 1; // We'll insert one row per group
        }
      });

      // Insert in reverse order to avoid index shifting
      insertions.reverse().forEach(({ index, groupIdx, group }) => {
        rows.splice(
          index,
          0,
          <StyledTableRow
            key={`show-more-${groupIdx}`}
            style={{
              backgroundColor: "#fafafa",
              textAlign: "center",
              height: "40px",
            }}
          >
            <TableCell
              colSpan="100"
              style={{
                padding: "8px 16px",
                textAlign: "center",
                cursor: "pointer",
                color: "#1976d2",
                fontWeight: "500",
              }}
            >
              Show more ({group.totalCount - group.count} hidden) - Load "
              {group.query}" as single search
            </TableCell>
          </StyledTableRow>,
        );
      });
    }

    return rows;
  }, [
    searchResults.results,
    searchResults.isMsearch,
    searchResults.queryGroups,
    searchIndex,
    expandedTypes,
    expandColumns,
    constraints,
    activeNameClasses,
    activeRanks,
    statusColors,
    rootRef,
    setAttributeSettings,
    formatCellValue,
    setCellClassName,
    setColSpan,
    setLinkIcons,
    handleRecordClick,
    handleToggleColSpan,
  ]);
};
