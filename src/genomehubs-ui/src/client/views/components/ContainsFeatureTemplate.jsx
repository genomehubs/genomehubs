import React from "react";
import Template from "./Template";

export const ContainsFeatureTemplate = ({
  featureId,
  featureType = "*",
  sequenceId,
  taxonomy,
}) => {
  let id = `featureContainsFeatureId`;
  let title = `Feature contains feature ID`;
  let description = "Find features containing a given feature ID";
  let props = {
    valueA_example: featureType,
    valueA_label: "feature type",
    valueA_description: "Feature type to restrict results to (use `*` for all)",
    valueB_example: sequenceId,
    valueB_label: "sequence ID",
    valueB_description: "Sequence ID to search on",
    valueC_example: featureId,
    valueC_label: "feature ID",
    valueC_description: "Feature ID to search for",
  };
  let query = `feature_type={valueA} AND start<=queryA.start AND end>=queryA.end AND sequence_id={valueB}`;
  let parts = [
    `/search?result=feature`,
    `taxonomy=${taxonomy}`,
    `query=${query}`,
    `queryA=feature--feature_id={valueC}`,
  ];
  let url = encodeURI(`${parts.join("&")}#${query}`)
    .replaceAll("%7B", "{")
    .replaceAll("%7D", "}");
  return (
    <Template
      id={id}
      title={title}
      description={description}
      url={url}
      {...props}
    />
  );
};

export default ContainsFeatureTemplate;
