import GetAppIcon from "@material-ui/icons/GetApp";
import { Grid } from "@material-ui/core";
import React from "react";
import RecordLink from "./RecordLink";
import VisibilityIcon from "@material-ui/icons/Visibility";
import classnames from "classnames";
import { compose } from "recompose";
import { setLinkIcons } from "./ResultTable";
import styles from "./Styles.scss";
import withRecord from "../hocs/withRecord";
import withTypes from "../hocs/withTypes";

const FilesPanel = ({ files, types, record, taxonId, title = "Files" }) => {
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.resultPanel
  );
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
                color: file_paths[value].color || "#1f78b4",
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
                  color={link.color || "#1f78b4"}
                />
              );
              runDivs.push(" ");
            }
          }
        }
        if (runDivs.length) {
          valueDivs.push(
            <Grid container key={run} direction="row">
              <Grid item xs={2}>
                <span className={styles.filesTitle}>{run}</span>
              </Grid>
              <Grid item xs={10}>
                {runDivs}
              </Grid>
            </Grid>
          );
        }
      }
      if (valueDivs.length) {
        linkDivs.push(
          <Grid key={value} item xs={12}>
            <Grid container direction="row">
              <Grid item xs={1}>
                <span className={styles.filesTitle}>{value}</span>
              </Grid>
              <Grid item xs={11}>
                {valueDivs}
              </Grid>
            </Grid>
          </Grid>
        );
      }
    }
  }

  return (
    <div className={css}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
      </div>
      <Grid container direction="column">
        {linkDivs}
      </Grid>
    </div>
  );
};

export default compose(withTypes, withRecord)(FilesPanel);
