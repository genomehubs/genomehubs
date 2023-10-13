import React, { memo, useEffect, useState } from "react";

import KeyboardArrowLeftIcon from "@material-ui/icons/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@material-ui/icons/KeyboardArrowRight";
import PhyloPic from "./PhyloPic";
import StaticPlotFile from "./StaticPlotFile";
import Tooltip from "./Tooltip";
import classnames from "classnames";
import { compose } from "recompose";
import formatter from "../functions/formatter";
import { makeStyles } from "@material-ui/core/styles";
import styles from "./Styles.scss";
import withFiles from "../hocs/withFiles";
import withFilesByAnalysisId from "../hocs/withFilesByAnalysisId";
import withRecord from "../hocs/withRecord";

const PhyloPics = ({ containerRef, record }) => {
  // const [filename, setFilename] = useState(filenames && filenames[0]);
  const [attribution, setAttribution] = useState();
  const [fileUrl, setFileUrl] = useState();
  const [source, setSource] = useState();
  const [sourceUrl, setSourceUrl] = useState();
  const [description, setDescription] = useState();
  const [license, setLicense] = useState();
  const [ratio, setRatio] = useState(1);
  const [contributor, setContributor] = useState();
  const [imageName, setImageName] = useState();
  const [imageRank, setImageRank] = useState();
  const [indices, setIndices] = useState({});

  if (!record) {
    return null;
  }

  let {
    scientific_name: scientificName,
    lineage,
    taxon_rank: rank,
  } = record.record;

  useEffect(() => {
    let isMounted = true;

    const lookupName = async (name) => {
      let response = await fetch(
        `https://api.phylopic.org/autocomplete?query=${name}`
      );
      let json = await response.json();
      if (json.matches && json.matches.includes(name)) {
        return true;
      }
    };

    const fetchData = async (name) => {
      let validName;
      let validRank;
      if (await lookupName(name)) {
        validName = name;
        validRank = rank;
      } else {
        // use lineage
        for (let { scientific_name, taxon_rank } of lineage) {
          if (await lookupName(scientific_name.toLowerCase())) {
            validName = scientific_name.toLowerCase();
            validRank = taxon_rank;
            break;
          }
        }
      }
      if (isMounted && validName) {
        let filterResponse = await fetch(
          `https://api.phylopic.org/nodes?build=262&filter_name=${validName}&page=0`
        );
        let filterJson = await filterResponse.json();
        let { href, title } = filterJson._links.items[0];
        if (isMounted && href) {
          let nodeResponse = await fetch(
            `https://api.phylopic.org${href}&embed_primaryImage=true`
          );
          let nodeJson = await nodeResponse.json();
          let { _links, attribution } = nodeJson._embedded.primaryImage;
          let { rasterFiles, contributor, license = "" } = _links;
          if (isMounted && rasterFiles) {
            setFileUrl(rasterFiles[1].href);
            let [width, height] = rasterFiles[1].sizes.split("x");
            setRatio(width / height);
            if (validRank.endsWith("species")) {
              setSource("Primary");
            } else {
              setSource(validRank == rank ? "Descendant" : "Ancestral");
            }
            setAttribution(attribution);
            setLicense(license);
            setContributor(contributor);
            setImageName(title);
            setImageRank(validRank);
          }
        }
      }
    };
    try {
      fetchData(scientificName.toLowerCase());
    } catch (err) {}
    return () => {
      isMounted = false;
    };
  }, [scientificName]);

  let forward, back;
  // useEffect(() => {
  //   if (analysisId && !files.isFetching && !filesByAnalysisId) {
  //     let query = `analysis_id==${analysisId}`;
  //     let result = "file";
  //     fetchFiles({ query, result });
  //   }
  //   if (filesByAnalysisId) {
  //     let index;
  //     let newIndices = {};
  //     if (filenames.length > 1) {
  //       for (let name of filenames) {
  //         let index = filesByAnalysisId.findIndex((obj) => obj.name == name);
  //         if (index > -1) {
  //           newIndices[name] = index;
  //         }
  //       }
  //       index = newIndices[filename];
  //       setIndices(newIndices);
  //     }
  //     index = filesByAnalysisId.findIndex((obj) => obj.name == filename);

  //     if (index > -1) {
  //       let meta = filesByAnalysisId[index];
  //       let [width, height] = meta.size_pixels.split("x");
  //       setRatio(width / height);
  //       setFileId(meta.file_id);
  //       setFileUrl(meta.url);
  //       setSourceUrl(meta.source_url);
  //       setTitle(meta.title);
  //       setDescription(meta.description);
  //     }
  //   }
  // }, [analysisId, filesByAnalysisId, filename]);
  // if (!analysisId) {
  //   return null;
  // }

  let index = 0;
  if (Object.keys(indices).length > 1) {
    let prevIndex = index > 0 ? index - 1 : Object.keys(indices).length - 1;
    back = (
      <div
        className={styles.plotArrow}
        style={{
          left: "-1.5em",
        }}
      >
        {/* <IconButton
          aria-label="show previous plot"
          size="large"
          onClick={() => {}}
        > */}
        <Tooltip title={"Previous plot"} arrow>
          <KeyboardArrowLeftIcon
            style={{ cursor: "pointer" }}
            aria-label="show previous plot"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setFilename(Object.keys(indices)[prevIndex]);
            }}
          />
        </Tooltip>
        {/* </IconButton> */}
      </div>
    );
    let nextIndex = index < Object.keys(indices).length - 1 ? index + 1 : 0;
    forward = (
      <div
        className={styles.plotArrow}
        style={{
          right: "-1.5em",
        }}
      >
        <Tooltip title={"Next plot"} arrow>
          <KeyboardArrowRightIcon
            style={{ cursor: "pointer" }}
            aria-label="show next plot"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setFilename(Object.keys(indices)[nextIndex]);
            }}
          />
        </Tooltip>
      </div>
    );
  }
  let imageDescription = `${imageName} silhouette courtesy of PhyloPic.org`;
  console.log(source);
  if (source == "Ancestral") {
    imageDescription += `. No matching image was found for ${scientificName} so the presented image of ${imageName} is a representative of the same ${imageRank}`;
  } else if (
    source == "Descendant" &&
    scientificName.toLowerCase != imageName
  ) {
    imageDescription += `. The presented image shows ${imageName}`;
  }
  return (
    <div className={styles.imageContainer}>
      <a href={sourceUrl} target="_blank">
        <div
        // style={{
        //   height: "100%",
        //   width: "100%",
        //   position: "relative",
        // }}
        >
          <Tooltip title={imageDescription} arrow>
            <div>
              {fileUrl && (
                <PhyloPic fileUrl={fileUrl} source={source} ratio={ratio} />
              )}
            </div>
          </Tooltip>
          {/* {forward}
          {back} */}
        </div>
        {attribution && license && !license.href.match("publicdomain") && (
          <Tooltip title={attribution} arrow>
            <div
              className={classnames(
                styles.imageCredit,
                styles[`imageCredit${source}`]
              )}
            >
              {attribution}/PhyloPic
            </div>
          </Tooltip>
        )}
      </a>
    </div>
  );
};

export default compose(withRecord)(PhyloPics);
