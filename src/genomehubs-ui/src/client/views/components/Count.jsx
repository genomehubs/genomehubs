import React, { useEffect, useState } from "react";

import { compose } from "recompose";
import fetchCount from "../functions/fetchCount";
import fetchFieldCount from "../functions/fetchFieldCount";
import fetchValueCount from "../functions/fetchValueCount";
import qs from "../functions/qs";
import withApi from "../hocs/withApi";

const Count = ({
  apiUrl,
  suffix,
  suffix_plural,
  of = "records",
  ...options
}) => {
  let [count, setCount] = useState();
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

  if (typeof count !== "undefined") {
    return (
      <div style={{ display: "flex", whiteSpace: "nowrap", maxHeight: "3em" }}>
        <span
          style={{
            fontSize: "2em",
            fontWeight: "bold",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          {count}
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
      </div>
    );
  }
  return null;
};

export default compose(withApi)(Count);
