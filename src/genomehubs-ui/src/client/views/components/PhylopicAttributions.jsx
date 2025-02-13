import React, { memo, useEffect, useState } from "react";

import classnames from "classnames";
import { compose } from "recompose";
import truncate from "../functions/truncate";
import withPhylopics from "../hocs/withPhylopics";

const PhylopicAttributions = ({
  phylopics,
  taxIds,
  showAncestral,
  embed = "svg",
  fontSize = 12,
}) => {
  if (!phylopics || !taxIds) {
    return null;
  }
  let attributions = [];
  let x = 0;
  let y = 0;
  let ctr = 1;
  for (let [taxonId, scientificName] of Object.entries(taxIds)) {
    if (typeof scientificName == "object") {
      scientificName = scientificName.scientificName;
    }
    let phylopicById = phylopics[taxonId];
    if (!phylopicById) {
      continue;
    }
    let {
      attribution,
      fileUrl,
      dataUri,
      source,
      sourceUrl,
      license,
      ratio,
      imageName,
      imageRank,
    } = phylopicById;

    if (!license || !license.href || license.href.match("publicdomain")) {
      continue;
    }
    let imageDescription;

    if (source == "Ancestral") {
      if (!showAncestral) {
        continue;
      } else {
        imageDescription = `${imageName} (same ${imageRank} as ${scientificName})`;
      }
    } else if (
      source == "Descendant" &&
      scientificName.toLowerCase != imageName
    ) {
      imageDescription = `${imageName} for ${scientificName}`;
    } else {
      imageDescription = scientificName;
    }
    if (attribution && license && !license.href.match("publicdomain")) {
      imageDescription = `${imageDescription}: ${attribution} ${license.name}`;
    }

    if (embed == "konva") {
      continue;
    } else if (embed) {
      attributions.push(
        <text
          key={taxonId}
          x={x}
          y={ctr * (fontSize * 1.2)}
          fontSize={fontSize}
          fill={"#333333"}
          textAnchor={"middle"}
        >
          {imageDescription}
        </text>,
      );
      ctr++;
    } else {
      attributions.push(<div key={taxonId}>{imageDescription}</div>);
    }
  }
  if (attributions.length > 0) {
    if (embed) {
      return <svg>{attributions}</svg>;
    } else {
      return (
        <div>
          Images courtesy of Phylopic.org. Credits for images not in the public
          domain are as follows:<div>{attributions}</div>
        </div>
      );
    }
  }
  return null;
};

export default compose(withPhylopics)(PhylopicAttributions);
