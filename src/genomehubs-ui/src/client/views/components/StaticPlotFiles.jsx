import React, { memo, useEffect, useState } from "react";

import KeyboardArrowLeftIcon from "@material-ui/icons/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@material-ui/icons/KeyboardArrowRight";
import StaticPlotFile from "./StaticPlotFile";
import Tooltip from "./Tooltip";
import { compose } from "recompose";
import formatter from "../functions/formatter";
import { makeStyles } from "@material-ui/core/styles";
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
        style={{
          height: "100%",
          position: "absolute",
          left: 0,
          top: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* <IconButton
          aria-label="show previous plot"
          size="large"
          onClick={() => {}}
        > */}
        <Tooltip title={"Previous"} arrow>
          <KeyboardArrowLeftIcon
            style={{ cursor: "pointer" }}
            aria-label="show previous plot"
            onClick={() => {
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
        style={{
          height: "100%",
          position: "absolute",
          right: 0,
          top: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Tooltip title={"Next"} arrow>
          <KeyboardArrowRightIcon
            style={{ cursor: "pointer" }}
            aria-label="show next plot"
            onClick={() => {
              setFilename(Object.keys(indices)[nextIndex]);
            }}
          />
        </Tooltip>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <StaticPlotFile
        fileId={fileId}
        fileUrl={fileUrl}
        ratio={ratio}
        containerRef={containerRef}
      />
      {forward}
      {back}
    </div>
  );
};

export default compose(
  memo,
  withApi,
  withFiles,
  withFilesByAnalysisId
)(StaticPlotFiles);
