import React, { useEffect, useState } from "react";

import DisplayCount from "./DisplayCount";
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
  currentRecord,
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

  if (currentRecord) {
    record = currentRecord;
  }

  if (typeof count !== "undefined") {
    return (
      <DisplayCount
        {...{
          values: {
            count,
            scientific_name: record.record.scientific_name,
          },
          description,
          handleClick,
          count,
          suffix,
          suffix_plural,
        }}
      />
    );
  }
  return null;
};

export default compose(withApi, withSiteName, withRecord)(Count);
