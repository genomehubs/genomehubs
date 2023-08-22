import React, { createElement, useEffect } from "react";
import { basename, siteName } from "../reducers/location";
import { useLocation, useNavigate } from "@reach/router";

import AggregationIcon from "./AggregationIcon";
import BasicSelect from "./BasicSelect";
import { Box } from "@material-ui/core";
import Divider from "@material-ui/core/Divider";
import EnumSelect from "./EnumSelect";
import FlagIcon from "./FlagIcon";
import Grid from "@material-ui/core/Grid";
import Highlight from "./Highlight";
import Logo from "./Logo";
import NavLink from "./NavLink";
import Report from "./Report";
import Template from "./Template";
import Toggle from "./Toggle";
import Tooltip from "./Tooltip";
import TranslatedValue from "./TranslatedValue";
import YAML from "js-yaml";
import classnames from "classnames";
import { compose } from "recompose";
import gfm from "remark-gfm";
import { gridPropNames } from "../functions/propNames";
import { h } from "hastscript";
import qs from "qs";
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

const pagesUrl = PAGES_URL;
const webpackHash = COMMIT_HASH || __webpack_hash__;

const fillTemplateValues = (value, extra) => {
  if (typeof value === "string") {
    let parts = value.split(/(?:\{\{|\}\})/);
    if (parts.length >= 3) {
      for (let i = 1; i < parts.length; i += 2) {
        let lower;
        if (parts[i].startsWith("lc_")) {
          lower = true;
          parts[i] = parts[i].replace(/^lc_/, "");
        }
        if (extra.hasOwnProperty(parts[i])) {
          parts[i] = lower ? extra[parts[i]].toLowerCase() : extra[parts[i]];
        } else {
          parts[i] = "";
        }
      }
      value = parts.join("");
    }
  }
  return value;
};

export const processProps = ({ props, extra = {}, newProps = {}, isGrid }) => {
  for (let [key, value] of Object.entries(props)) {
    if (isGrid && !gridPropNames.has(key)) {
      continue;
    }
    if (value === false) {
      newProps[key] = value;
    } else if (value == "") {
      newProps[key] = true;
    } else if (key == "className") {
      newProps["className"] = styles[value];
    } else if (key.startsWith("exclude")) {
      newProps[key] = Array.isArray(value) ? value : value.split(",");
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
    } else if (key != "pageId") {
      newProps[key] = value;
    }
  }
  return newProps;
};

export const RehypeComponentsList = (extra) => {
  return {
    a: (props) => <NavLink {...processProps({ props, extra })} />,
    aggregation: (props) => <AggregationIcon method={props.method} />,
    divider: (props) => (
      <Divider
        orientation={props.orientation || "vertical"}
        flexItem
        className={styles.divider}
      />
    ),
    flag: (props) => {
      let { countryCode, size, ...gridProps } = props;

      return (
        <Grid {...processProps({ props: gridProps })}>
          <FlagIcon
            {...processProps({ props: { countryCode, size }, extra })}
          />
        </Grid>
      );
    },
    grid: (props) => {
      let { toggle, expand, title, ...gridProps } = props;
      if (toggle && toggle !== true && toggle !== "true") {
        toggle = false;
      }
      if (props.hasOwnProperty("toggle")) {
        return (
          <Toggle {...processProps({ props: { toggle, expand, title } })}>
            <Grid {...processProps({ props: gridProps, isGrid: true })} />
          </Toggle>
        );
      } else {
        return <Grid {...processProps({ props, isGrid: true })} />;
      }
    },
    hub: (props) => <span {...processProps({ props })}>{siteName}</span>,
    logo: (props) => {
      let { lineColor, fillColor, ...gridProps } = props;
      return (
        <Grid {...processProps({ props: gridProps })}>
          <div className={styles.fixedAr} style={{ background: fillColor }}>
            <Logo {...{ lineColor, fillColor }} />
          </div>
        </Grid>
      );
    },
    img: (props) => (
      <div className={styles.centerContent}>
        <img {...processProps({ props })} alt={props.alt.toString()} />
      </div>
    ),
    include: (props) => {
      let nested = <Nested pgId={props.pageId} {...props} />;
      let css = styles.reportContainer;
      if (props.className) {
        css = classnames(styles.reportContainer, styles[props.className]);
      }

      return (
        <Grid {...processProps({ props, isGrid: true })} item className={css}>
          {nested}
        </Grid>
      );
    },
    item: (props) => (
      <Grid
        {...processProps({ props, isGrid: true })}
        item
        className={styles.reportContainer}
      />
    ),
    markdown: (props) => {
      return (
        <Nested
          pgId={props.pageId}
          {...processProps({ props: { ...props, ...extra } })}
        />
      );
    },
    pre: (props) => {
      let className = props.children?.[0]?.props?.className;
      if (className) {
        let nestedProps = YAML.load(props.children[0].props.children[0] || "");
        if (className == "language-report") {
          return (
            <Report
              {...processProps({ props: nestedProps, extra })}
              className={styles.reportContainer}
            />
          );
        } else if (className == "language-template") {
          return (
            <Grid {...processProps({ props: nestedProps, isGrid: true })} item>
              <Template
                {...processProps({ props: { ...nestedProps, ...extra } })}
              />
            </Grid>
          );
        }
      }
      return <Highlight {...processProps({ props })} />;
    },
    report: (props) => {
      let css = styles.reportContainer;
      if (props.className) {
        css = classnames(styles.reportContainer, styles[props.className]);
      }
      return <Report {...processProps({ props, extra })} className={css} />;
    },
    select: (props) => {
      let processedProps = processProps({ props, extra });
      let handleChange = () => {};
      if (processedProps.url) {
        handleChange = (e) => {
          e.preventDefault();
          extra.navigate(`${processedProps.url}${e.target.value}`);
        };
      }
      if (processedProps.enumValues) {
        return <EnumSelect {...processedProps} handleChange={handleChange} />;
      }
      return <BasicSelect {...processedProps} handleChange={handleChange} />;
    },
    span: (props) => <span {...processProps({ props })} />,
    templat: (props) => (
      <Template
        {...processProps({ props })}
        className={styles.reportContainer}
      />
    ),
    tooltip: (props) => {
      return (
        <Tooltip {...processProps({ props, newProps: { placement: "top" } })}>
          <span>{props.children}</span>
        </Tooltip>
      );
    },
    translated: (props) => {
      return <TranslatedValue {...processProps({ props, extra })} />;
    },
  };
};

export function compile(val, components = RehypeComponentsList()) {
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

const Markdown = ({
  classes,
  pgId,
  pageId,
  pagesById,
  pagesIsFetching,
  fetchPages,
  siteStyles,
  components = {},
  ...extra
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!pagesById && !pagesIsFetching) {
      if (pgId) {
        fetchPages(pgId);
      } else if (pageId) {
        fetchPages(pageId);
      }
    }
  }, [pgId, pageId, pagesIsFetching]);
  const { contents, ast } = compile(
    fillTemplateValues(pagesById, {
      ...extra,
      ...qs.parse((location.search || "").replace("?", "")),
    }),
    {
      ...RehypeComponentsList({
        ...qs.parse(location.search.replace(/^\?/, "")),
        navigate,
        ...extra,
      }),
      ...components,
    }
  );
  let css;
  if (siteStyles) {
    css = classes.root;
  } else {
    css = classnames(styles.markdown, classes.root);
  }
  return <div className={css}>{contents}</div>;
};

export const Nested = compose(withPages, withStyles(styles))(Markdown);

export default compose(withPages, withStyles(styles))(Markdown);
