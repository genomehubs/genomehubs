import { Link, useLocation } from "@reach/router";
import React, { Fragment, createElement, useEffect, useState } from "react";

import Grid from "@material-ui/core/Grid";
import Highlight from "./Highlight";
import MarkdownInclude from "./MarkdownInclude";
import NavLink from "./NavLink";
import Report from "./Report";
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
import { withStyles } from "@material-ui/core/styles";

const siteName = SITENAME;
const pagesUrl = PAGES_URL;
// const webpackHash = __webpack_hash__ || COMMIT_HASH;
const webpackHash = COMMIT_HASH;

export const processProps = (props, newProps = {}) => {
  for (const [key, value] of Object.entries(props)) {
    if (value == "") {
      newProps[key] = true;
    } else if (key == "className") {
      newProps["className"] = styles[value];
    } else if (key.startsWith("exclude")) {
      newProps[key] = value.split(",");
    } else if (key == "src") {
      if (PAGES_URL.startsWith("http")) {
        console.log({ value, pagesUrl });
        newProps["src"] = `${pagesUrl}${value.replace(/^\/static/, "")}`;
        console.log(newProps["src"]);
      } else {
        newProps["src"] = value.match(/\?/) ? value : `${value}?${webpackHash}`;
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
  grid: (props) => <Grid {...processProps(props)} />,
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
    visit(
      tree,
      ["textDirective", "leafDirective", "containerDirective"],
      ondirective
    );
  }

  function ondirective(node) {
    var data = node.data || (node.data = {});
    var hast = h(node.name, node.attributes);
    data.hName = hast.tagName;
    data.hProperties = hast.properties;
  }
}
