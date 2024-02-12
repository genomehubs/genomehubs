import React, { useEffect, useState } from "react";

import { Chip } from "@material-ui/core";
import LaunchIcon from "@material-ui/icons/Launch";
import Tooltip from "./Tooltip";
import compareValues from "../functions/compareValues";
import { compose } from "recompose";
import fetchCount from "../functions/fetchCount";
import fetchFieldCount from "../functions/fetchFieldCount";
import fetchValueCount from "../functions/fetchValueCount";
import getPrimaryAssemblyId from "../functions/getPrimaryAssemblyId";
import qs from "../functions/qs";
import withApi from "../hocs/withApi";
import withRecord from "../hocs/withRecord";

const RecordLink = ({
  record,
  result,
  rank,
  condition,
  url,
  label,
  description,
  color = "#1f78b4",
}) => {
  let [count, setCount] = useState();

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
      } else {
        value = value[k];
      }
      if (typeof value === "undefined") {
        throw `ERROR fetching ${key}`;
      }
    }
    if (value.values) {
      return value.values;
    } else if (value.value) {
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
        if (i % 2 == 1) {
          return fetchValue(part, record.record);
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
        let recordValue = fetchValue(key, record.record);
        if (cmp && !compareValues(recordValue, value, cmp)) {
          return null;
        }
      }
    }

    href = fillValues(url);
  } catch (err) {
    return null;
  }

  useEffect(() => {
    // const queryString = qs.stringify({ ...options });
    // let isApiSubscribed = true;
    // let fetchFunc;
    // switch (of) {
    //   case "fields":
    //     fetchFunc = fetchFieldCount;
    //     break;
    //   case "values":
    //     fetchFunc = fetchValueCount;
    //     break;
    //   default:
    //     fetchFunc = fetchCount;
    // }
    // fetchFunc({ queryString }).then((response) => {
    //   if (isApiSubscribed) {
    //     setCount(response);
    //   }
    // });
    // return () => {
    //   // cancel the subscription
    //   isApiSubscribed = false;
    // };
    // fetchCount({ queryString, setCount });
  }, []);

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
          {label} <LaunchIcon fontSize="inherit" />
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
