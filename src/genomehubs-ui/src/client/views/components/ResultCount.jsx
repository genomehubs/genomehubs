import { useEffect, useState } from "react";

import { compose } from "redux";
import fetchCount from "#functions/fetchCount";
import qs from "#functions/qs";
import withApi from "#hocs/withApi";

const ResultCount = ({ apiUrl, ...options }) => {
  let [count, setCount] = useState();
  useEffect(() => {
    const queryString = qs.stringify({ ...options });
    fetchCount({ queryString, setCount });
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
