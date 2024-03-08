import LaunchIcon from "@material-ui/icons/Launch";
import React from "react";
import Tooltip from "./Tooltip";
import classnames from "classnames";
import { compose } from "recompose";
import { format } from "d3-format";
import styles from "./Styles.scss";
import withRecord from "../hocs/withRecord";

const NameGroup = ({ title, names, sort, bold }) => {
  if (!names || names.length == 0) {
    return null;
  }
  if (sort) {
    names = names.sort((a, b) => a.name.localeCompare(b.name));
  }
  let nameDivs = names.map((obj, i) => {
    let { name, source } = obj;
    let sources;
    if (source && source.length > 0) {
      sources = source.map((s, j) => (
        <span key={j} className={styles.source}>
          {s}
        </span>
      ));
    }
    return (
      <span key={i} className={classnames(styles.name, bold && styles.bold)}>
        {name}
        {sources ? <> {sources}</> : ""}
      </span>
    );
  });
  return (
    <div className={styles.nameGroup}>
      <div className={styles.title}>{title} </div>
      <div className={styles.content}>{nameDivs}</div>
    </div>
  );
};

export const NamesList = ({ names }) => {
  let nameDivs = [];

  let nameClasses = new Set([
    "scientific name",
    "common name",
    "synonym",
    "authority",
  ]);
  let extraClasses = [];
  let namesByClass = {};

  names.forEach((obj, i) => {
    let name = obj.name || obj.identifier;
    let sourceClass = obj.class.replace("_", " ");
    if (sourceClass == "genbank common name") {
      sourceClass = "common name";
    }

    let source;
    let prefix;
    if (obj.source_url) {
      source = (
        <a href={`${obj.source_url}`} target="_blank">
          {nameClasses.has(sourceClass) ? "" : `${sourceClass} `}
          <LaunchIcon fontSize="inherit" />
        </a>
      );
    } else if (obj.source_stub) {
      source = (
        <a href={`${obj.source_stub}${name}`} target="_blank">
          {nameClasses.has(sourceClass) ? "" : `${sourceClass} `}
          <LaunchIcon fontSize="inherit" />
        </a>
      );
    } else if (obj.source_url_stub) {
      if (obj.source) {
        prefix = `${obj.source}:`;
      }
      source = (
        <a href={`${obj.source_url_stub}${name}`} target="_blank">
          {nameClasses.has(sourceClass) ? "" : `${sourceClass} `}
          <LaunchIcon fontSize="inherit" />
        </a>
      );
    }
    if (source) {
      source = (
        <Tooltip title={obj.source} position="top" arrow>
          {source}
        </Tooltip>
      );
    }

    if (source && !nameClasses.has(sourceClass)) {
      sourceClass = "other";
    } else if (
      !nameClasses.has(sourceClass) &&
      !extraClasses.includes(sourceClass)
    ) {
      extraClasses.push(sourceClass);
    }
    if (!namesByClass[sourceClass]) {
      namesByClass[sourceClass] = [];
    }

    // let nameDiv = (
    //   <span key={i} className={styles.name}>
    //     {prefix}
    //     {name}
    //     {sourceClass == "other" ? <> - {source}</> : ""}
    //   </span>
    // );
    // nameDivs.push(nameDiv);
    let index = namesByClass[sourceClass].findIndex((n) => n.name == name);
    if (index > -1) {
      namesByClass[sourceClass][index].source.push(source);
    } else {
      namesByClass[sourceClass].push({ name, source: source ? [source] : [] });
    }
  });
  let extraGroups = [];
  for (let extraClass of extraClasses) {
    let names = namesByClass[extraClass];
    extraGroups.push(
      <NameGroup key={extraClass} title={extraClass} names={names} sort />
    );
  }
  return (
    <div
      style={{
        maxWidth: "100%",
        // columns: "3 200px",
        // columnRule: "1px solid",
      }}
    >
      <NameGroup
        title="scientific name"
        names={namesByClass["scientific name"]}
        bold
      />
      <NameGroup
        title={`common name${
          namesByClass["common name"] && namesByClass["common name"].length > 1
            ? "s"
            : ""
        }`}
        names={namesByClass["common name"]}
      />
      <NameGroup
        title={`synonym${
          namesByClass["synonym"] && namesByClass["synonym"].length > 1
            ? "s"
            : ""
        }`}
        names={namesByClass["synonym"]}
        sort
      />
      <NameGroup title="authority" names={namesByClass["authority"]} />
      {extraGroups}
      <NameGroup
        title={`link${
          namesByClass["other"] && namesByClass["other"].length > 1 ? "s" : ""
        }`}
        names={namesByClass["other"]}
        sort
      />
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
