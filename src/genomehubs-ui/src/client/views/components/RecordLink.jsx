import React, { useEffect } from "react";

import { Chip } from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import Tooltip from "./Tooltip";
import compareValues from "../functions/compareValues";
import { compose } from "recompose";
import getPrimaryAssemblyId from "../functions/getPrimaryAssemblyId";
import { recordLinkIcon as recordLinkIconStyle } from "./Styles.scss";
import withApi from "../hocs/withApi";
import withRecord from "../hocs/withRecord";

const RecordLink = ({
  record,
  records,
  fetchRecord,
  recordIsFetching,
  result,
  rank,
  condition,
  url,
  label,
  description,
  color = "#1f78b4",
  icon,
  EndIcon = LaunchIcon,
}) => {
  useEffect(() => {
    if (
      condition?.startsWith("assembly.") &&
      record?.record?.assembly_id &&
      !records[record.record.assembly_id] &&
      !recordIsFetching
    ) {
      fetchRecord(record.record.assembly_id, "assembly", taxonomy);
    }
  }, [records]);

  if (!record || !record.record || !url || !label) {
    return null;
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

  const fetchValue = (key, value) => {
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

  let href;

  try {
    if (condition) {
      let [key, cmp, value] = condition.split(/([!><=]+)/);
      if (key && key == "assemblyId") {
        if (!getPrimaryAssemblyId(record)) {
          return null;
        }
      } else {
        let currentRecord = condition?.startsWith("assembly.")
          ? { assembly: records[record.record.assembly_id]?.record }
          : record.record;
        let recordValue = fetchValue(key, currentRecord);
        if (cmp && !compareValues(recordValue, value, cmp)) {
          return null;
        }
        if (!cmp && !recordValue) {
          return null;
        }
      }
    }
    href = fillValues(url);
  } catch (err) {
    return null;
  }

  icon = icon ? <img className={recordLinkIconStyle} src={icon} /> : null;

  let chip = (
    <Chip
      // variant="outlined"
      color="primary"
      style={{
        backgroundColor: color,
        color: "white",
        textDecoration: "none",
        fontSize: "1em",
        margin: "0.2em 0",
      }}
      // size="small"
      label={
        <span style={{ whiteSpace: "nowrap" }}>
          {icon}
          {label}{" "}
          <EndIcon fontSize="inherit" style={{ marginBottom: "-0.1em" }} />
        </span>
      }
      component="a"
      target="_blank"
      href={href}
      clickable
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

export default compose(withApi, withRecord)(RecordLink);
