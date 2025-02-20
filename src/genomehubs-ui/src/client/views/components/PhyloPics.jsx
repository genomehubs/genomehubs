import React, { memo, useEffect, useState } from "react";
import {
  blank as blankStyle,
  imageContainer as imageContainerStyle,
  imageCreditAncestral as imageCreditAncestralStyle,
  imageCreditDescendant as imageCreditDescendantStyle,
  imageCreditPrimary as imageCreditPrimaryStyle,
  imageCredit as imageCreditStyle,
} from "./Styles.scss";

import { Image } from "react-konva";
import PhyloPic from "./PhyloPic";
import Tooltip from "./Tooltip";
import classnames from "classnames";
import { compose } from "recompose";
import truncate from "../functions/truncate";
import useImage from "use-image";
import withPhylopicsById from "../hocs/withPhylopicsById";
import withRecord from "../hocs/withRecord";
import withTheme from "#hocs/withTheme";

const styleMap = {
  imageCreditStyle,
  imageCreditPrimaryStyle,
  imageCreditDescendantStyle,
  imageCreditAncestralStyle,
};

const PhyloPicKonvaImage = ({ fileUrl, maxHeight, maxWidth, x, y }) => {
  let [image] = useImage(fileUrl);
  return (
    <Image
      image={image}
      x={-maxWidth / 2}
      y={y}
      height={maxHeight}
      width={maxWidth}
      crossOrigin="anonymous"
    />
  );
};

const PhyloPics = ({
  phylopicById,
  record,
  currentRecord = record,
  taxonId = taxonId || currentRecord.record?.taxon_id,
  scientificName = scientificName || currentRecord.record?.scientific_name,
  fetchPhylopic,
  sourceColors = true,
  showAncestral = true,
  maxHeight,
  maxWidth,
  fixedRatio,
  embed,
  transform,
  theme,
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
  }, [taxonId]);

  useEffect(() => {
    setMetadata(phylopicById || {});
  }, [phylopicById]);

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
      if (embed) {
        return null;
      }
      imageDescription = (
        <div>
          No image was found for {scientificName} at{" "}
          <a
            href={"https://phylopic.org"}
            onClick={(e) => {
              e.preventDefault();
              window.open("https://phylopic.org", "_blank");
            }}
          >
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
          <a
            href={sourceUrl}
            onClick={(e) => {
              e.preventDefault();
              window.open(sourceUrl, "_blank");
            }}
          >
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
        <a
          href={sourceUrl}
          onClick={(e) => {
            e.preventDefault();
            window.open(sourceUrl, "_blank");
          }}
        >
          PhyloPic.org
        </a>
        . The presented image shows {imageName}
      </div>
    );
  } else {
    imageDescription = (
      <div>
        {scientificName} image from{" "}
        <a
          href={sourceUrl}
          onClick={(e) => {
            e.preventDefault();
            window.open(sourceUrl, "_blank");
          }}
        >
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
          image credit: {attribution}{" "}
          <a
            href={license.href}
            onClick={(e) => {
              e.preventDefault();
              window.open(license.href, "_blank");
            }}
          >
            {license.name}
          </a>
        </small>
      </div>
    );
  }
  if (embed) {
    if (embed == "konva") {
      return (
        <PhyloPicKonvaImage
          fileUrl={fileUrl}
          maxHeight={maxHeight}
          maxWidth={maxWidth}
          {...props}
        />
      );
    } else {
      return (
        <g transform={transform}>
          <image
            x={-maxWidth / 2}
            y={-maxHeight / 2}
            height={maxHeight}
            width={maxWidth}
            xlinkHref={dataUri}
            style={
              theme == "dark"
                ? {
                    filter: "invert(1) brightness(.9)",
                  }
                : {}
            }
          />
          <Tooltip
            title={imageDescription}
            arrow
            enterDelay={500}
            leaveDelay={100}
            disableInteractive={false}
          >
            <rect
              fill={"rgba(255,255,255,0)"}
              fillOpacity={0}
              stroke={"none"}
              x={-maxWidth / 2}
              y={-maxHeight / 2}
              height={maxHeight}
              width={maxWidth}
            />
          </Tooltip>
        </g>
      );
    }
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
            >
              {truncate(attribution, 20)}/PhyloPic.org{" "}
              <a
                onClick={(e) => {
                  e.preventDefault();
                  window.open(license.href, "_blank");
                }}
              >
                {license.name}
              </a>
            </div>
          </Tooltip>
        )}
    </div>
  );
};

export default compose(
  withTheme,
  withRecord,
  withPhylopicsById,
  memo,
)(PhyloPics);
