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
    imageDescription = `No matching image was found for ${scientificName} so the presented image of ${imageName} from PhyloPic.org is a representative of the same ${imageRank}`;
  } else if (
    source == "Descendant" &&
    scientificName.toLowerCase != imageName
  ) {
    imageDescription = `${scientificName} image from PhyloPic.org. The presented image shows ${imageName}`;
  } else {
    imageDescription = `${scientificName} image from PhyloPic.org`;
  }
  return (
    <div className={styles.imageContainer}>
      <a href={sourceUrl} target="_blank">
        <div>
          <Tooltip title={imageDescription} arrow>
            <div>
              {fileUrl && (
                <PhyloPic
                  fileUrl={fileUrl}
                  source={source}
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
                {truncate(attribution, 20)}/PhyloPic
              </div>
            </Tooltip>
          )}
      </a>
    </div>
  );
};

export default compose(withRecord, withPhylopicsById)(PhyloPics);
