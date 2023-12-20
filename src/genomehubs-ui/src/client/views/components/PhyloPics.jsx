import React, { useEffect, useState } from "react";

import PhyloPic from "./PhyloPic";
import Tooltip from "./Tooltip";
import classnames from "classnames";
import { compose } from "recompose";
import styles from "./Styles.scss";
import truncate from "../functions/truncate";
import withPhylopicsById from "../hocs/withPhylopicsById";
import withRecord from "../hocs/withRecord";

const PhyloPics = ({
  phylopicById,
  fetchPhylopic,
  currentRecord,
  sourceColors = true,
  showAncestral = true,
  record,
  maxHeight,
  fixedRatio,
}) => {
  const [metadata, setMetadata] = useState({});

  if (!currentRecord && !record) {
    return null;
  }
  record = currentRecord || record;

  let {
    scientific_name: scientificName,
    lineage,
    taxon_rank: rank,
    taxon_id: taxonId,
  } = record.record;

  useEffect(() => {
    if (taxonId && !phylopicById) {
      fetchPhylopic({ taxonId, scientificName, lineage, rank });
    }
  }, [taxonId]);

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
        <Tooltip title={imageDescription} styleName="dark" interactive arrow>
          <div className={styles.blank}></div>
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
  return (
    <div className={styles.imageContainer}>
      <div>
        <Tooltip title={imageDescription} styleName="dark" interactive arrow>
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
                styles.imageCredit,
                styles[`imageCredit${source}`]
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
