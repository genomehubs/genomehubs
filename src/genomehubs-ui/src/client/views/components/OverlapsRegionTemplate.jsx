import React from "react";
import Template from "./Template";

export const OverlapsRegionTemplate = ({
  featureId,
  featureType = "*",
  sequenceId,
  region,
  taxonomy,
  contains,
  overlaps,
  contained,
}) => {
  let query;
  let type;
  let [start, end] = region.split("-");
  if (contains) {
    query = `feature_type={valueA} AND sequence_id={valueB} AND start<={valueC} AND end>={valueD}`;
    type = "containing";
  } else if (contained) {
    type = "contained by";
    query = `feature_type={valueA} AND sequence_id={valueB} AND start>={valueC} AND end<={valueD}`;
  } else {
    type = "overlapping";
    query = `feature_type={valueA} AND sequence_id={valueB} AND start<={valueD} AND end>={valueC}`;
  }

  let id = `${type.replaceAll(/\s(.)/g, (c) => c.toUpperCase())}FeatureId`;
  let title = `Feature ${type}`;
  let description = `Find features ${type} a region`;
  let props = {
    valueA_example: featureType,
    valueA_label: "feature type",
    valueA_description: "Feature type to restrict results to (use `*` for all)",
    valueB_example: sequenceId,
    valueB_label: "sequence ID",
    valueB_description: "Sequence ID to search on",
    valueC_example: start,
    valueC_label: "start",
    valueC_description: "start coordinate of region to search for",
    valueD_example: end,
    valueD_label: "end",
    valueD_description: "end coordinate of region to search for",
  };
  let parts = [
    `/search?result=feature`,
    `taxonomy=${taxonomy}`,
    `query=${query}`,
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

export default OverlapsRegionTemplate;
