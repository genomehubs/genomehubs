import React, { useEffect, useState } from "react";
import { fieldCount, simpleCount, valueCount } from "../functions/resultCount";

import DisplayCount from "./DisplayCount";
import { compose } from "recompose";
import formats from "../functions/formats";
import qs from "../functions/qs";
import { useNavigate } from "@reach/router";
import withApi from "../hocs/withApi";
import withQueryById from "../hocs/withQueryById";
import withRecord from "../hocs/withRecord";
import withSiteName from "#hocs/withSiteName";

const Count = ({
  apiUrl,
  suffix,
  suffix_plural,
  inline,
  of = "records",
  description,
  basename,
  record,
  currentRecord,
  fetchQueryResults,
  queryById,
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
    if (!queryById) {
      fetchQueryResults(options);
      setCount("...");
      return;
    }
    switch (of) {
      case "fields":
        setCount(fieldCount(queryById));
        break;
      case "values":
        setCount(valueCount(queryById));
        break;
      default:
        setCount(simpleCount(queryById));
    }
  }, [queryById]);

  const handleClick = () => {
    navigate(
      `${basename}/search?${qs.stringify({ ...options, report: "sources" })}`,
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
            scientific_name: record?.record?.scientific_name || "",
          },
          description,
          handleClick,
          count,
          suffix,
          suffix_plural,
          inline,
        }}
      />
    );
  }
  return null;
};

export default compose(withApi, withSiteName, withRecord, withQueryById)(Count);
