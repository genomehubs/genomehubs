import React, { useEffect, useState } from "react";

import Tooltip from "./Tooltip";
import { compose } from "recompose";
import fetchCount from "../functions/fetchCount";
import fetchFieldCount from "../functions/fetchFieldCount";
import fetchValueCount from "../functions/fetchValueCount";
import formats from "../functions/formats";
import qs from "../functions/qs";
import { useNavigate } from "@reach/router";
import withApi from "../hocs/withApi";
import withRecord from "../hocs/withRecord";
import withSiteName from "../hocs/withSiteName";

const Count = ({
  apiUrl,
  suffix,
  suffix_plural,
  of = "records",
  description,
  basename,
  record,
  ...props
}) => {
  let {
    children,
    apiStatus,
    attempt,
    setApiStatus,
    setAttempt,
    siteName,
    dispatch,
    attributeSettings,
    records,
    recordIsFetching,
    recordId,
    lineage,
    fetchRecord,
    resetRecord,
    setRecordId,
    setAttributeSettings,
    ...options
  } = props;
  let [count, setCount] = useState();
  const navigate = useNavigate();
  useEffect(() => {
    const queryString = qs.stringify({ ...options });
    let isApiSubscribed = true;
    let fetchFunc;
    switch (of) {
      case "fields":
        fetchFunc = fetchFieldCount;
        break;
      case "values":
        fetchFunc = fetchValueCount;
        break;
      default:
        fetchFunc = fetchCount;
    }
    fetchFunc({ queryString }).then((response) => {
      if (isApiSubscribed) {
        setCount(response);
      }
    });
    return () => {
      // cancel the subscription
      isApiSubscribed = false;
    };
    // fetchCount({ queryString, setCount });
  }, []);

  const handleClick = () => {
    navigate(
      `${basename}/search?${qs.stringify({ ...options, report: "sources" })}`
    );
  };

  const fillValues = (str) => {
    return str
      .split(/\{(.+?)\}/)
      .map((part, i) => {
        if (!part) {
          return "";
        }
        if (i % 2 == 1) {
          if (part == "count") {
            return count.toLocaleString();
          }
          if (part == "scientific_name") {
            return record.record.scientific_name;
          }
        }
        return part;
      })
      .join("");
  };

  if (typeof count !== "undefined") {
    return (
      <div style={{ display: "flex", whiteSpace: "nowrap", maxHeight: "3em" }}>
        <Tooltip title={fillValues(description)} arrow placement={"top"}>
          <span style={{ cursor: "pointer" }} onClick={handleClick}>
            <span
              style={{
                fontSize: "2em",
                fontWeight: "bold",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {formats(count, "integer")}
            </span>
            <span
              style={{
                fontSize: "1.5em",
                minHeight: "2em",
                display: "inline-flex",
                alignItems: "center",
                marginLeft: "0.25em",
              }}
            >
              {count == 1 ? suffix : suffix_plural || suffix}
            </span>
          </span>
        </Tooltip>
      </div>
    );
  }
  return null;
};

export default compose(withApi, withSiteName, withRecord)(Count);
