import React, { memo, useEffect, useState } from "react";

import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import StaticPlotFile from "./StaticPlotFile";
import Tooltip from "./Tooltip";
import { compose } from "recompose";
import formatter from "../functions/formatter";
import makeStyles from '@mui/styles/makeStyles';
import styles from "./Styles.scss";
import withApi from "../hocs/withApi";
import withFiles from "../hocs/withFiles";
import withFilesByAnalysisId from "../hocs/withFilesByAnalysisId";

const StaticPlotFiles = ({
  analysisId,
  containerRef,
  filenames,
  analysisMeta,
  apiUrl,
  files,
  filesByAnalysisId,
  fetchFiles,
}) => {
  const [filename, setFilename] = useState(filenames && filenames[0]);
  const [fileId, setFileId] = useState();
  const [fileUrl, setFileUrl] = useState();
  const [sourceUrl, setSourceUrl] = useState();
  const [description, setDescription] = useState();
  const [title, setTitle] = useState();
  const [ratio, setRatio] = useState(1);
  const [indices, setIndices] = useState({});

  let forward, back;
  useEffect(() => {
    if (analysisId && !files.isFetching && !filesByAnalysisId) {
      let query = `analysis_id==${analysisId}`;
      let result = "file";
      fetchFiles({ query, result });
    }
    if (filesByAnalysisId) {
      let index;
      let newIndices = {};
      if (filenames.length > 1) {
        for (let name of filenames) {
          let index = filesByAnalysisId.findIndex((obj) => obj.name == name);
          if (index > -1) {
            newIndices[name] = index;
          }
        }
        index = newIndices[filename];
        setIndices(newIndices);
      }
      index = filesByAnalysisId.findIndex((obj) => obj.name == filename);

      if (index > -1) {
        let meta = filesByAnalysisId[index];
        let [width, height] = meta.size_pixels.split("x");
        setRatio(width / height);
        setFileId(meta.file_id);
        setFileUrl(meta.url);
        setSourceUrl(meta.source_url);
        setTitle(meta.title);
        setDescription(meta.description);
      }
    }
  }, [analysisId, filesByAnalysisId, filename]);
  if (!analysisId) {
    return null;
  }

  let index = Object.keys(indices).indexOf(filename);
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

  return (
    <div className={styles.plotContainer}>
      <a href={sourceUrl} target="_blank">
        <div
          style={{
            height: "100%",
            width: "100%",
            position: "relative",
          }}
        >
          <Tooltip title={`Click to open ${sourceUrl} in a new tab`} arrow>
            <div>
              <StaticPlotFile
                fileId={fileId}
                fileUrl={fileUrl}
                ratio={ratio}
                containerRef={containerRef}
              />
            </div>
          </Tooltip>
          {forward}
          {back}
        </div>
        {description && (
          <Tooltip title={description} arrow>
            <div className={styles.plotDescription}>{title}</div>
          </Tooltip>
        )}
      </a>
    </div>
  );
};

export default compose(
  memo,
  withApi,
  withFiles,
  withFilesByAnalysisId
)(StaticPlotFiles);
