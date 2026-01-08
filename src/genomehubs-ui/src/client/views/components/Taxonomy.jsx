import React, { memo, useEffect, useState } from "react";

import BasicMenu from "./BasicMenu";
import { compose } from "redux";
import dispatchMessage from "../hocs/dispatchMessage";
import dispatchRecord from "../hocs/dispatchRecord";
import qs from "../functions/qs";
import { setMessage } from "../reducers/message";
import { useNavigate } from "@reach/router";
import withApi from "../hocs/withApi";
import withTaxonomy from "../hocs/withTaxonomy";

const Taxonomy = ({
  apiStatus,
  attempt,
  fetchTaxonomies,
  resetRecord,
  setMessage,
  setTaxonomy,
  taxonomy = "",
  taxonomies = [],
  display = true,
}) => {
  let options = qs.parse(location.search.replace(/^\?/, ""));
  const multiple = 5;
  const interval = 1000;
  const [duration, setDuration] = useState(attempt * multiple * interval);

  useEffect(() => {
    if (taxonomies.length == 0) {
      const timer = setTimeout(
        () => {
          setDuration(duration);
          fetchTaxonomies();
        },
        apiStatus ? 100 : duration,
      );
      setDuration(attempt * multiple * interval);
      return () => clearTimeout(timer);
    }
    setTaxonomy(options.taxonomy);
  }, [options.taxonomy]);

  useEffect(() => {
    if (apiStatus) {
      setMessage({
        duration: 0,
        severity: "info",
      });
    } else {
      if (duration >= 1000 && duration < attempt * multiple * interval) {
        setMessage({
          message: `Unable to connect to API, retrying in ${duration / 1000}s`,
          duration: duration + interval,
          severity: "warning",
        });
      }
      const timer = setTimeout(() => {
        setDuration(duration - interval);
      }, interval);
      return () => clearTimeout(timer);
    }
  }, [apiStatus, duration]);
  const navigate = useNavigate();

  const handleTaxonomyChange = (value) => {
    options.taxonomy = value;
    resetRecord();
    navigate(`${location.pathname}?${qs.stringify(options)}${location.hash}`);
  };

  if (!display) {
    return null;
  }

  return (
    <BasicMenu
      current={options.taxonomy || taxonomy}
      id={"taxonomy-menu"}
      helperText={"Choose taxonomy"}
      handleChange={handleTaxonomyChange}
      options={taxonomies}
    />
  );
};

export default compose(
  memo,
  withApi,
  dispatchMessage,
  withTaxonomy,
  dispatchRecord,
)(Taxonomy);
