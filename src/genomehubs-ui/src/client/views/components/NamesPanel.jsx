import LaunchIcon from "@material-ui/icons/Launch";
import React from "react";
import classnames from "classnames";
import { compose } from "recompose";
import { format } from "d3-format";
import styles from "./Styles.scss";
import withRecord from "../hocs/withRecord";

export const NamesList = ({ names }) => {
  let nameDivs = [];
  names.forEach((obj, i) => {
    let name = obj.name || obj.identifier;
    let source = obj.class;
    let prefix;
    if (obj.source_url) {
      source = (
        <a href={`${obj.source_url}`} target="_blank">
          {source} <LaunchIcon fontSize="inherit" />
        </a>
      );
    } else if (obj.source_stub) {
      source = (
        <a href={`${obj.source_stub}${name}`} target="_blank">
          {source} <LaunchIcon fontSize="inherit" />
        </a>
      );
    } else if (obj.source_url_stub) {
      if (obj.source) {
        prefix = `${obj.source}:`;
      }
      source = (
        <a href={`${obj.source_url_stub}${name}`} target="_blank">
          {source} <LaunchIcon fontSize="inherit" />
        </a>
      );
    }
    nameDivs.push(
      <span key={i} className={styles.name}>
        {prefix}
        {name} - {source}
      </span>
    );
  });
  return (
    <div
      style={{
        maxWidth: "100%",
        columns: "3 200px",
        columnRule: "1px solid",
      }}
    >
      {nameDivs}
    </div>
  );
};

const NamesPanel = ({ taxon_id, names }) => {
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.resultPanel
  );
  let nameDiv = <NamesList names={names} />;

  return (
    <div className={css}>
      <div className={styles.header}>
        <span className={styles.title}>Names</span>
      </div>
      {nameDiv}
    </div>
  );
};

export default compose(withRecord)(NamesPanel);
