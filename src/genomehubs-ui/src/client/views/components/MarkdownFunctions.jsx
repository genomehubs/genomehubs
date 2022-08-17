import { Link, useLocation } from "@reach/router";
import React, { Fragment, createElement, useEffect, useState } from "react";

import AggregationIcon from "./AggregationIcon";
import Grid from "@material-ui/core/Grid";
import Highlight from "./Highlight";
import MarkdownInclude from "./MarkdownInclude";
import NavLink from "./NavLink";
import Report from "./Report";
import Toggle from "./Toggle";
import Tooltip from "@material-ui/core/Tooltip";
import classnames from "classnames";
import { compose } from "recompose";
import gfm from "remark-gfm";
import { h } from "hastscript";
import rehypeRaw from "rehype-raw";
import rehypeReact from "rehype-react";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkReact from "remark-react";
import remarkRehype from "remark-rehype";
import styles from "./Styles.scss";
import unified from "unified";
import { visit } from "unist-util-visit";
import withPages from "../hocs/withPages";
import withSiteName from "../hocs/withSiteName";
import { withStyles } from "@material-ui/core/styles";

const siteName = SITENAME;
const basename = BASENAME;
const pagesUrl = PAGES_URL;
const webpackHash = __webpack_hash__ || COMMIT_HASH;
// const webpackHash = COMMIT_HASH;

export const processProps = (props, newProps = {}) => {
  for (const [key, value] of Object.entries(props)) {
    if (value === false) {
      newProps[key] = value;
    } else if (value == "") {
      newProps[key] = true;
    } else if (key == "className") {
      newProps["className"] = styles[value];
    } else if (key.startsWith("exclude")) {
      newProps[key] = value.split(",");
    } else if (key == "src") {
      if (PAGES_URL.startsWith("http")) {
        newProps["src"] = `${pagesUrl}${value.replace(/^\/static/, "")}`;
      } else {
        newProps["src"] = value.replace(
          /^\/static\//,
          `${basename}/static/${webpackHash}/`
        );
      }
    } else if (key == "xs") {
      newProps["xs"] = value * 1;
    } else if (key == "spacing") {
      newProps["spacing"] = value * 1;
    } else {
      newProps[key] = value;
    }
  }
  return newProps;
};

export const RehypeComponentsList = {
  a: (props) => <NavLink {...processProps(props)} />,
  aggregation: (props) => <AggregationIcon method={props.method} />,
  grid: (props) => {
    let { toggle, expand, title, ...gridProps } = props;
    if (toggle && toggle !== true && toggle !== "true") {
      toggle = false;
    }
    if (props.hasOwnProperty("toggle")) {
      return (
        <Toggle {...processProps({ toggle, expand, title })}>
          <Grid {...processProps(gridProps)} />
        </Toggle>
      );
    } else {
      return <Grid {...processProps(props)} />;
    }
  },
  hub: (props) => <span {...processProps(props)}>{siteName}</span>,
  img: (props) => (
    <div className={styles.centerContent}>
      <img {...processProps(props)} alt={props.alt.toString()} />
    </div>
  ),
  item: (props) => (
    <Grid {...processProps(props)} item className={styles.reportContainer} />
  ),
  pre: (props) => <Highlight {...props} />,
  report: (props) => (
    <Report {...processProps(props)} className={styles.reportContainer} />
  ),
  span: (props) => <span {...processProps(props)} />,
  tooltip: (props) => {
    return (
      <Tooltip {...processProps(props, { placement: "top" })}>
        <span>{props.children}</span>
      </Tooltip>
    );
  },
};

export function compile(val, components = RehypeComponentsList) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkReact)
    .use(gfm)
    .use(remarkDirective)
    .use(htmlDirectives)
    .use(remarkRehype)
    .use(rehypeRaw)
    .use(rehypeReact, {
      createElement,
      components,
    });

  const ast = processor.runSync(processor.parse(val));

  return {
    ast,
    contents: processor.stringify(ast),
  };
}

export function htmlDirectives() {
  return transform;

  function transform(tree) {
    let index = { i: 0 };
    visit(
      tree,
      ["textDirective", "leafDirective", "containerDirective"],
      (node) => ondirective(node, index)
    );
  }

  function ondirective(node, index) {
    let data = node.data || (node.data = {});
    let hast = h(node.name, node.attributes);
    data.hName = hast.tagName;
    data.hProperties = hast.properties;
    if (data.hName == "report") {
      data.hProperties.id = `report-${data.hProperties.report}-${index.i}`;
      index.i += 1;
    }
  }
}
