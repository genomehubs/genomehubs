import React, { useEffect, useState } from "react";

import { compose } from "recompose";
import qs from "../functions/qs";
import withApi from "../hocs/withApi";

const ResultCount = ({ apiUrl, ...options }) => {
  let [count, setCount] = useState();
  useEffect(() => {
    const fetchCount = async () => {
      const queryString = qs.stringify({ ...options });
      const endpoint = "count";
      let url = `${apiUrl}/${endpoint}?${queryString}`;
      // try {
      let json;
      try {
        const response = await fetch(url);
        json = await response.json();
      } catch (error) {
        json = console.log("An error occured.", error);
      }
      if (json && json.status && json.status.success) {
        setCount(json.count);
      }
    };
    fetchCount();
  }, []);

  if (typeof count !== "undefined") {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "4em" }}>{count}</div>
        <div>results</div>
      </div>
    );
  }
  return null;
};

export default compose(withApi)(ResultCount);
