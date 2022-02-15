import React, { memo, useEffect } from "react";

import BasicMenu from "./BasicMenu";
import { compose } from "recompose";
import dispatchRecord from "../hocs/dispatchRecord";
import qs from "qs";
import { useNavigate } from "@reach/router";
import withTaxonomy from "../hocs/withTaxonomy";

const Taxonomy = ({
  fetchTaxonomies,
  resetRecord,
  setTaxonomy,
  taxonomy = "",
  taxonomies = [],
  display = true,
}) => {
  let options = qs.parse(location.search.replace(/^\?/, ""));
  useEffect(() => {
    if (taxonomies.length == 0) {
      fetchTaxonomies();
    }
    setTaxonomy(options.taxonomy);
  }, [options.taxonomy]);
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

export default compose(memo, withTaxonomy, dispatchRecord)(Taxonomy);
