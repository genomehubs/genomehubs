import {
  filesTitle as filesTitleStyle,
  header as headerStyle,
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  resultPanel as resultPanelStyle,
  title as titleStyle,
} from "./Styles.scss";

import GetAppIcon from "@mui/icons-material/GetApp";
import Grid from "@mui/material/Grid";
import React from "react";
import RecordLink from "./RecordLink";
import VisibilityIcon from "@mui/icons-material/Visibility";
import classnames from "classnames";
import { compose } from "redux";
import { setLinkIcons } from "./ResultTable";
import withColors from "#hocs/withColors";
import withRecord from "#hocs/withRecord";
import withTheme from "#hocs/withTheme";
import withTypes from "#hocs/withTypes";

const FilesPanel = ({
  files,
  types,
  record,
  taxonId,
  title = "Files",
  colorScheme,
  theme,
}) => {
  let defaultColor = colorScheme[theme].linkColor;
  let css = classnames(infoPanelStyle, infoPanel1ColumnStyle, resultPanelStyle);
  if (!types) {
    return null;
  }
  let { file_paths } = types.files;
  if (!file_paths) {
    return null;
  }
  let linkDivs = [];
  for (let value of files.value) {
    if (file_paths[value] && files.metadata) {
      let valueDivs = [];
      for (let run of Object.keys(files.metadata[value])) {
        let runDivs = [];
        for (let key of Object.keys(file_paths[value])) {
          if (files.metadata[value][run].includes(key)) {
            let linkIcons = setLinkIcons({
              type: {
                name: "files",
                field: `files.${value}.${run}`,
                color: file_paths[value].color || defaultColor,
                ...types.files,
              },
              key,
              record,
            });
            for (let link of linkIcons) {
              let RadioIcon = null;
              if (link.icon) {
                if (link.icon == "download") {
                  RadioIcon = GetAppIcon;
                } else if (link.icon == "view") {
                  RadioIcon = VisibilityIcon;
                }
              }
              runDivs.push(
                <RecordLink
                  key={key}
                  url={link.url}
                  label={key}
                  description={link.title}
                  EndIcon={RadioIcon}
                  color={link.color || defaultColor}
                />,
              );
              runDivs.push(" ");
            }
          }
        }
        if (runDivs.length) {
          valueDivs.push(
            <Grid container key={run} direction="row">
              <Grid size={2}>
                <span className={filesTitleStyle}>{run}</span>
              </Grid>
              <Grid size={10}>{runDivs}</Grid>
            </Grid>,
          );
        }
      }
      if (valueDivs.length) {
        linkDivs.push(
          <Grid key={value}>
            <Grid container direction="row">
              <Grid size={1}>
                <span className={filesTitleStyle}>{value}</span>
              </Grid>
              <Grid size={11}>{valueDivs}</Grid>
            </Grid>
          </Grid>,
        );
      }
    }
  }

  return (
    <div className={css}>
      <div className={headerStyle}>
        <span className={titleStyle}>{title}</span>
      </div>
      <Grid container direction="column">
        {linkDivs}
      </Grid>
    </div>
  );
};

export default compose(
  withTypes,
  withTheme,
  withColors,
  withRecord,
)(FilesPanel);
