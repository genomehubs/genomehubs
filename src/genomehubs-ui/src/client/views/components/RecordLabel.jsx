import React, { useEffect } from "react";

import { Chip } from "@mui/material";
import GppGoodIcon from "@mui/icons-material/GppGood";
import LaunchIcon from "@mui/icons-material/Launch";
import MoreIcon from "@mui/icons-material/More";
import ShoppingBasketIcon from "@mui/icons-material/ShoppingBasket";
import Tooltip from "./Tooltip";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import compareValues from "../functions/compareValues";
import { compose } from "recompose";
import getContrast from "../functions/getContrast";
import getPrimaryAssemblyId from "../functions/getPrimaryAssemblyId";
import { recordLinkIcon as recordLinkIconStyle } from "./Styles.scss";
import withApi from "../hocs/withApi";
import withColors from "../hocs/withColors";
import withRecord from "../hocs/withRecord";

const RecordLabel = ({
  record,
  records,
  fetchRecord,
  recordIsFetching,
  result,
  rank,
  condition,
  label,
  description,
  color = "#1f78b4",
  levels,
  colors,
  icon,
  EndIcon = LaunchIcon,
}) => {
  let contrast;
  useEffect(() => {
    if (
      condition?.startsWith("assembly.") &&
      record?.record?.assembly_id &&
      !records[record.record.assembly_id] &&
      !recordIsFetching
    ) {
      fetchRecord({
        recordId: record.record.assembly_id,
        result: "assembly",
        taxonomy,
      });
    }
  }, [records]);

  if (!record || !record.record || !label) {
    return null;
  }

  if (color.match(/^\d+\/\d+$/)) {
    let [num, den] = color.split("/");
    if (levels && levels[den] && levels[den][num - 1]) {
      color = levels[den][num - 1];
    } else {
      color = colors[num - 1];
    }
    contrast = getContrast(color, 0.25);
  } else {
    contrast = getContrast(color, 0.25);
  }

  if (result) {
    let match;
    for (let r of result.split(",")) {
      if (record.index.startsWith(r)) {
        match = true;
        break;
      }
    }
    if (!match) {
      return null;
    }
  }

  if (rank) {
    let ranks = rank.split(",");
    if (!ranks.includes(record.record.taxon_rank)) {
      return null;
    }
  }

  const fetchValue = (key, v) => {
    let value = v;
    if (key == "assemblyId") {
      return getPrimaryAssemblyId(record);
    }
    let keys = key.split(/[\.\[]+/);
    for (let k of keys) {
      if (k.match(/\]$/)) {
        k = k.replace(/\]$/, "");
        let [subkey, subval] = k.split(":");
        value = subval
          ? value.find((o) => o[subkey] == subval)
          : value.find((o) => o.hasOwnProperty(subkey));
      } else if (value && value.hasOwnProperty(k)) {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
      if (typeof value === "undefined") {
        continue;
        // throw `ERROR fetching ${key}`;
      }
    }
    if (value && value.values) {
      return value.values;
    } else if (value && value.value) {
      return value.value;
    }
    return value;
  };

  const fillValues = (str) => {
    return str
      .split(/\{(.+?)\}/)
      .map((part, i) => {
        if (!part) {
          return "";
        }
        let currentRecord = part?.startsWith("assembly.")
          ? { assembly: records[record.record.assembly_id]?.record }
          : record.record;

        if (i % 2 == 1) {
          return fetchValue(part, currentRecord);
        }
        return part;
      })
      .join("");
  };

  try {
    if (condition) {
      let conditions = condition.split("&&");
      let match = true;
      for (let cond of conditions) {
        let [key, cmp, value] = cond.split(/([!><=]+)/);
        if (key && key == "assemblyId") {
          if (!getPrimaryAssemblyId(record)) {
            match = false;
            break;
          }
        } else {
          let currentRecord = cond?.startsWith("assembly.")
            ? { assembly: records[record.record.assembly_id]?.record }
            : record.record;
          let recordValue = fetchValue(key, currentRecord);
          if (cmp && !compareValues(recordValue, value, cmp)) {
            match = false;
            break;
          }
          if (!cmp && !recordValue) {
            match = false;
            break;
          }
        }
      }
      if (!match) {
        return null;
      }
    }
  } catch (err) {
    return null;
  }

  let muiIcon, extIcon;

  switch (icon) {
    case "prize":
      muiIcon = <WorkspacePremiumIcon sx={{ "&&": { color } }} />;
      break;
    case "quality":
      muiIcon = <GppGoodIcon sx={{ "&&": { color } }} />;
      break;
    case "catch":
      muiIcon = <ShoppingBasketIcon sx={{ "&&": { color } }} />;
      break;
    case "more":
      muiIcon = <MoreIcon sx={{ "&&": { color } }} />;
      break;
    default:
      extIcon = <img className={recordLinkIconStyle} src={icon} />;
  }
  //icon ? <img className={recordLinkIconStyle} src={icon} /> : null;

  let chip = (
    <Chip
      variant="outlined"
      color="primary"
      size="small"
      style={{
        border: `solid 0.2em ${color}`,
        backgroundColor: `${color}66`,
        color: contrast,
        textDecoration: "none",
        fontSize: "1em",
        margin: "-0.5em 0 0.2em 0",
      }}
      icon={muiIcon}
      // size="small"
      label={
        <span style={{ whiteSpace: "nowrap" }}>
          {extIcon}
          {label}
        </span>
      }
      component="span"
    />
  );
  if (description) {
    chip = (
      <Tooltip title={fillValues(description)} arrow placement={"top"}>
        {chip}
      </Tooltip>
    );
  }
  return chip;
};

export default compose(withApi, withColors, withRecord)(RecordLabel);
