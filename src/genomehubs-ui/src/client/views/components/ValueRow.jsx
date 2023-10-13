import { Chip, Grid } from "@material-ui/core";
import React, { useEffect, useState } from "react";

import DisplayCount from "./DisplayCount";
import LaunchIcon from "@material-ui/icons/Launch";
import Tooltip from "./Tooltip";
import compareValues from "../functions/compareValues";
import { compose } from "recompose";
import fetchCount from "../functions/fetchCount";
import fetchFieldCount from "../functions/fetchFieldCount";
import fetchValueCount from "../functions/fetchValueCount";
import fillValues from "../functions/fillValues";
import getPrimaryAssemblyId from "../functions/getPrimaryAssemblyId";
import qs from "../functions/qs";
import withApi from "../hocs/withApi";
import withRecord from "../hocs/withRecord";

const ValueRow = ({
  record,
  result,
  rank,
  condition,
  url,
  suffix,
  description,
  value,
  unit,
  color = "#1f78b4",
}) => {
  if (!record || !record.record || !suffix || !value) {
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

  const fetchValue = (key) => {
    if (key == "assemblyId") {
      return getPrimaryAssemblyId(record);
    }
    let value = record.record;
    for (let k of key.split(".")) {
      value = value[k];
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

  try {
    if (condition) {
      let [key, cmp, value] = condition.split(/([!><=]+)/);
      if (key && key == "assemblyId") {
        if (!getPrimaryAssemblyId(record)) {
          return null;
        }
      } else {
        let recordValue = fillValues(key, {
          attributes: record.record.attributes,
        });
        if (cmp && !compareValues(recordValue, value, cmp)) {
          return null;
        }
      }
    }
  } catch (err) {
    throw err;
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

  let count;
  try {
    count = fetchValue(value);
  } catch (err) {
    return null;
  }
  let handleClick;
  return (
    <DisplayCount
      {...{
        values: {
          count,
          scientific_name: record.record.scientific_name,
          attributes: record.record.attributes,
          assemblyId: record.record.assembly_id,
        },
        description,
        handleClick,
        count,
        suffix,
        unit,
        // suffix,
        // suffix_plural,
      }}
    />
  );
};

export default compose(withApi, withRecord)(ValueRow);
