import { memo, useEffect, useState } from "react";
import {
  plotArrow as plotArrowStyle,
  plotContainer as plotContainerStyle,
  plotDescription as plotDescriptionStyle,
} from "./Styles.scss";

import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import StaticPlotFile from "./StaticPlotFile";
import Tooltip from "./Tooltip";
import { compose } from "redux";
import withApi from "#hocs/withApi";
import withFiles from "#hocs/withFiles";
import withFilesByAnalysisId from "#hocs/withFilesByAnalysisId";

const StaticPlotFiles = ({
  analysisId,
  containerRef,
  filenames,
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
        className={plotArrowStyle}
        style={{
          left: "-1.5em",
        }}
      >
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
      </div>
    );
    let nextIndex = index < Object.keys(indices).length - 1 ? index + 1 : 0;
    forward = (
      <div
        className={plotArrowStyle}
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
    <div className={plotContainerStyle}>
      <a href={sourceUrl} target="_blank" rel="noreferrer">
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
            <div className={plotDescriptionStyle}>{title}</div>
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
  withFilesByAnalysisId,
)(StaticPlotFiles);
