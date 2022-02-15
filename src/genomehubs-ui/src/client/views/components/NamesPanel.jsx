import LaunchIcon from "@material-ui/icons/Launch";
import React from "react";
import classnames from "classnames";
import { compose } from "recompose";
import { format } from "d3-format";
import styles from "./Styles.scss";
import withRecord from "../hocs/withRecord";

const NamesPanel = ({ taxon_id, names }) => {
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.resultPanel
  );
  let nameDivs = [];
  names.forEach((name, i) => {
    let source = name.class;
    let prefix;
    if (name.source_stub) {
      source = (
        <a href={`${name.source_stub}${name.name}`} target="_blank">
          {source} <LaunchIcon fontSize="inherit" />
        </a>
      );
    } else if (name.source_url_stub) {
      if (name.source) {
        prefix = `${name.source}:`;
      }
      source = (
        <a href={`${name.source_url_stub}${name.name}`} target="_blank">
          {source} <LaunchIcon fontSize="inherit" />
        </a>
      );
    }
    nameDivs.push(
      <span key={i} className={styles.name}>
        {prefix}
        {name.name} - {source}
      </span>
    );
  });

  return (
    <div className={css}>
      <div className={styles.header}>
        <span className={styles.title}>Names</span>
      </div>
      <div
        style={{
          maxWidth: "100%",
          columns: "3 200px",
          columnRule: "1px solid",
        }}
      >
        {nameDivs}
      </div>
    </div>
  );
};

export default compose(withRecord)(NamesPanel);
