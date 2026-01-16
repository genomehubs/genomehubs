import {
  OddTableCell,
  SortableCell,
  StickyCell,
  TableCell,
  darkColor,
  lightColor,
} from "./StyledComponents";

import FilterListIcon from "@mui/icons-material/FilterList";
import IconButton from "@mui/material/IconButton";
import ResultFilter from "../ResultFilter";
import Tooltip from "../Tooltip";
import { useMemo } from "react";

const arrToObj = (arr) =>
  Array.isArray(arr) ? arr.reduce((a, b) => ({ ...a, [b]: true }), {}) : {};

/**
 * Custom hook to build table headers, filters, and expanded columns
 * Memoizes the result to prevent unnecessary recalculations
 */
export const useTableHeaders = ({
  activeNameClasses = {},
  activeRanks = {},
  searchIndex,
  expandedTypes = [],
  expandColumns = {},
  searchDefaults = {},
  searchTerm = {},
  types = {},
  constraints = {},
  sortBy,
  sortOrder,
  classes,
  handleTableSort,
  handleToggleColSpan,
  handleToggleExclusion,
  setAttributeSettings,
  statusColors = {},
  setSearchDefaults,
  setCellClassName,
  setColSpan,
}) => {
  return useMemo(() => {
    let heads = [
      <SortableCell
        name={"scientific_name"}
        sortDirection={sortBy === "scientific_name" ? sortOrder : false}
        key={"scientific_name"}
        CustomCell={StickyCell}
        {...{ classes, handleTableSort, searchIndex, sortBy, sortOrder }}
      />,
      <SortableCell
        name={"taxon_id"}
        sortDirection={sortBy === "taxon_id" ? sortOrder : false}
        key={"taxon_id"}
        {...{ classes, handleTableSort, searchIndex, sortBy, sortOrder }}
      />,
    ];
    let filters = [
      <ResultFilter
        name={"scientific_name"}
        key={"scientific_name"}
        type="hidden"
        TableCell={StickyCell}
        value={""}
      />,
      <ResultFilter
        name={"taxon_id"}
        key={"taxon_id"}
        type="hidden"
        value={""}
      />,
    ];
    let expandedCols = [
      <StickyCell key={"scientific_name"} />,
      <TableCell key={"taxon_id"} />,
    ];
    let maxColSpan = 0;

    Object.keys(activeNameClasses).forEach((nameClass) => {
      heads.push(
        <SortableCell
          name={nameClass}
          key={`name-${nameClass}`}
          sortDirection={sortBy === nameClass ? sortOrder : false}
          {...{ classes, handleTableSort, searchIndex, sortBy, sortOrder }}
        />,
      );
      filters.push(
        <ResultFilter
          name={nameClass}
          key={`name-${nameClass}`}
          value={""}
          colSpan={1}
        />,
      );
      expandedCols.push(<TableCell key={nameClass} />);
    });

    Object.keys(activeRanks).forEach((rank) => {
      heads.push(
        <SortableCell
          name={rank}
          key={`rank-${rank}`}
          sortDirection={sortBy === rank ? sortOrder : false}
          {...{ classes, handleTableSort, searchIndex, sortBy, sortOrder }}
        />,
      );
      filters.push(
        <ResultFilter name={rank} key={`rank-${rank}`} value={""} />,
      );
      expandedCols.push(<TableCell key={rank} />);
    });

    if (searchIndex == "assembly" || searchIndex == "feature") {
      heads.push(
        <SortableCell
          name={"assembly_id"}
          key={"assembly_id"}
          sortDirection={sortBy === "assembly_id" ? sortOrder : false}
          {...{ classes, handleTableSort, searchIndex, sortBy, sortOrder }}
        />,
      );
      filters.push(
        <ResultFilter name={"assembly_id"} key={"assembly_id"} value={""} />,
      );
      expandedCols.push(<TableCell key={"assembly_id"} />);
    }

    if (searchIndex == "sample") {
      heads.push(
        <SortableCell
          name={"sample_id"}
          key={"sample_id"}
          sortDirection={sortBy === "sample_id" ? sortOrder : false}
          {...{ classes, handleTableSort, searchIndex, sortBy, sortOrder }}
        />,
      );
      filters.push(
        <ResultFilter name={"sample_id"} key={"sample_id"} value={""} />,
      );
      expandedCols.push(<TableCell key={"sample_id"} />);
    }

    if (searchIndex == "feature") {
      heads = [heads.pop()];
      heads.push(
        <SortableCell
          name={"feature_id"}
          key={"feature_id"}
          sortDirection={sortBy === "feature_id" ? sortOrder : false}
          {...{ classes, handleTableSort, searchIndex, sortBy, sortOrder }}
        />,
      );
      filters.push(
        <ResultFilter name={"feature_id"} key={"feature_id"} value={""} />,
      );
      expandedCols.push(<TableCell key={"feature_id"} />);
    }

    for (let type of expandedTypes) {
      let sortDirection = sortBy === type.field ? sortOrder : false;
      let colCount, colSpan;
      ({ colCount, colSpan, maxColSpan } = setColSpan({
        type,
        maxColSpan,
      }));

      heads.push(
        <SortableCell
          key={`${type.name}_${type.summary}`}
          name={type.name}
          field={type.field}
          summary={type.summary}
          description={type.description}
          color={`${type.color}${darkColor}`}
          status={type.status}
          handleTableSort={
            type.processed_type != "geo_point" && handleTableSort
          }
          setAttributeSettings={setAttributeSettings}
          showExcludeBoxes={searchIndex == "taxon" ? "all" : "missing"}
          excludeAncestral={arrToObj(searchTerm.excludeAncestral)}
          excludeDescendant={arrToObj(searchTerm.excludeDescendant)}
          excludeDirect={arrToObj(searchTerm.excludeDirect)}
          excludeMissing={arrToObj(searchTerm.excludeMissing)}
          {...{
            classes,
            colCount,
            colSpan,
            handleToggleColSpan,
            handleToggleExclusion,
            searchIndex,
            setAttributeSettings,
            sortBy,
            sortDirection,
            sortOrder,
            statusColors,
          }}
        />,
      );

      let fieldConstraints = constraints[type.field.replace(/:.+$/, "")] || [];
      filters.push(
        <ResultFilter
          key={`${type.name}_${type.summary}`}
          name={type.name}
          field={type.field}
          colSpan={colSpan}
          color={`${type.color}${darkColor}`}
          TableCell={colSpan > 0 ? TableCell : TableCell}
          value={""}
          fieldMeta={types[type.name]}
          constraints={fieldConstraints}
        />,
      );

      if (colSpan > 0) {
        fieldConstraints.forEach((v, i) => {
          let css = setCellClassName(
            i,
            fieldConstraints.length,
            expandColumns[type.field],
          );
          let color = type.color || type.file_paths?.[v]?.color;
          expandedCols.push(
            <OddTableCell
              key={`${type.name}_${type.summary}-${v}`}
              className={css}
              style={{
                backgroundColor: `${color}${
                  i % 2 == 0 ? lightColor : darkColor
                }`,
              }}
            >
              {v.split("_").join(`_\u200b`).split(".").join(`.\u200b`)}
            </OddTableCell>,
          );
        });
      } else {
        expandedCols.push(
          <TableCell
            key={`${type.name}_${type.summary}`}
            colSpan={colSpan + 1}
            style={{
              backgroundColor: `${type.color}${lightColor}`,
            }}
          />,
        );
      }
    }

    heads.push(
      <Tooltip title={"Click to toggle filter options"} arrow key={"filter"}>
        <TableCell>
          <IconButton
            aria-label="toggle filter"
            size="small"
            onClick={() =>
              setSearchDefaults({ showFilter: !searchDefaults.showFilter })
            }
          >
            <FilterListIcon />
          </IconButton>
        </TableCell>
      </Tooltip>,
    );
    filters.push(<TableCell key={"filter"} />);
    expandedCols.push(<TableCell key={"filter"} />);

    return { heads, filters, expandedCols, maxColSpan };
  }, [
    activeNameClasses,
    activeRanks,
    searchIndex,
    expandedTypes,
    expandColumns,
    searchDefaults,
    searchTerm,
    types,
    constraints,
    sortBy,
    sortOrder,
    classes,
    handleTableSort,
    handleToggleColSpan,
    handleToggleExclusion,
    setAttributeSettings,
    statusColors,
    setSearchDefaults,
    setCellClassName,
    setColSpan,
  ]);
};
