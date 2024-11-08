import React, { useEffect, useState } from "react";
import {
  blank as blankStyle,
  imageContainer as imageContainerStyle,
  imageCreditAncestral as imageCreditAncestralStyle,
  imageCreditDescendant as imageCreditDescendantStyle,
  imageCreditPrimary as imageCreditPrimaryStyle,
  imageCredit as imageCreditStyle,
} from "./Styles.scss";

import PhyloPic from "./PhyloPic";
import Tooltip from "./Tooltip";
import classnames from "classnames";
import { compose } from "recompose";
import truncate from "../functions/truncate";
import withPhylopicsById from "../hocs/withPhylopicsById";
import withRecord from "../hocs/withRecord";

const styleMap = {
  imageCreditStyle,
  imageCreditPrimaryStyle,
  imageCreditDescendantStyle,
  imageCreditAncestralStyle,
};

const PhyloPics = ({
  phylopicById,
  record,
  currentRecord = record,
  taxonId = taxonId || currentRecord.record.taxon_id,
  scientificName = scientificName || currentRecord.record.scientific_name,
  fetchPhylopic,
  sourceColors = true,
  showAncestral = true,
  maxHeight,
  maxWidth,
  fixedRatio,
  embed,
  ...props
}) => {
  const [metadata, setMetadata] = useState({});

  if (!taxonId) {
    return null;
  }

  useEffect(() => {
    if (!phylopicById) {
      fetchPhylopic({ taxonId });
    }
  }, [taxonId, phylopicById]);

  useEffect(() => {
    setMetadata(phylopicById || {});
  }, [phylopicById]);

  let {
    attribution,
    fileUrl,
    source,
    sourceUrl,
    license,
    ratio,
    imageName,
    imageRank,
  } = metadata;
  if (maxWidth && !maxHeight) {
    maxHeight = maxWidth / ratio;
  } else if (maxHeight && !maxWidth) {
    maxWidth = maxHeight * ratio;
  } else if (maxHeight * ratio > maxWidth) {
    maxHeight = maxWidth / ratio;
  } else {
    maxWidth = maxHeight * ratio;
  }

  if (!ratio) {
    return null;
  }

  let imageDescription;
  if (source == "Ancestral") {
    if (!showAncestral) {
      imageDescription = (
        <div>
          No image was found for {scientificName} at{" "}
          <a href="https://phylopic.org" target="_blank">
            PhyloPic.org
          </a>
        </div>
      );
      return (
        <Tooltip
          title={imageDescription}
          styleName="dark"
          disableInteractive={false}
          arrow
        >
          <div className={blankStyle}></div>
        </Tooltip>
      );
    } else {
      imageDescription = (
        <div>
          No image was found for {scientificName} so the presented image of{" "}
          {imageName} from{" "}
          <a href={fileUrl} target="_blank">
            PhyloPic.org
          </a>{" "}
          is a representative of the same {imageRank}
        </div>
      );
    }
  } else if (
    source == "Descendant" &&
    scientificName.toLowerCase != imageName
  ) {
    imageDescription = (
      <div>
        {scientificName} image from{" "}
        <a href={fileUrl} target="_blank">
          PhyloPic.org
        </a>
        . The presented image shows {imageName}
      </div>
    );
  } else {
    imageDescription = (
      <div>
        {scientificName} image from{" "}
        <a href={fileUrl} target="_blank">
          PhyloPic.org
        </a>
      </div>
    );
  }
  if (
    fixedRatio &&
    attribution &&
    license &&
    !license.href.match("publicdomain")
  ) {
    imageDescription = (
      <div>
        {imageDescription}
        <small>
          image credit: <a href={license.href}>{attribution}</a>
        </small>
      </div>
    );
  }
  if (embed) {
    return (
      <image
        x={-maxWidth / 2}
        y={-maxHeight / 2}
        height={maxHeight}
        width={maxWidth}
        xlinkHref={fileUrl}
      />
    );
  }
  return (
    <div className={imageContainerStyle}>
      <div>
        <Tooltip
          title={imageDescription}
          styleName="dark"
          disableInteractive={false}
          arrow
        >
          <div>
            {fileUrl && (
              <PhyloPic
                fileUrl={fileUrl}
                source={sourceColors ? source : "Primary"}
                ratio={ratio}
                fixedRatio={fixedRatio}
                maxHeight={maxHeight}
              />
            )}
          </div>
        </Tooltip>
      </div>
      {!fixedRatio &&
        attribution &&
        license &&
        !license.href.match("publicdomain") && (
          <Tooltip title={attribution} arrow>
            <div
              className={classnames(
                imageCreditStyle,
                styleMap[`imageCredit${source}Style`],
              )}
              onClick={(e) => {
                e.preventDefault();
                window.open(license.href, "_blank");
              }}
            >
              {truncate(attribution, 20)}/PhyloPic.org
            </div>
          </Tooltip>
        )}
    </div>
  );
};

export default compose(withRecord, withPhylopicsById)(PhyloPics);
