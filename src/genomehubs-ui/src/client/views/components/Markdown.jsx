import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import React, { useEffect, useRef, useState } from "react";
import { basename, siteName } from "../reducers/location";
import {
  centerContent as centerContentStyle,
  divider as dividerStyle,
  fixedArSixteenNine as fixedArSixteenNineStyle,
  fixedAr as fixedArStyle,
  inline as inlineStyle,
  markdown as markdownStyle,
  negativePadded as negativePaddedStyle,
  padded as paddedStyle,
  paragraph as paragraphStyle,
  reportContainer as reportContainerStyle,
  unpaddedParagraph as unpaddedParagraphStyle,
  unpadded as unpaddedStyle,
} from "./Styles.scss";
import { useLocation, useNavigate } from "@reach/router";

import AggregationIcon from "./AggregationIcon";
import ArtTrackIcon from "@mui/icons-material/ArtTrack";
import Badge from "./Badge";
import BasicSelect from "./BasicSelect";
import Breadcrumbs from "./Breadcrumbs";
import ColorButton from "./ColorButton";
import Count from "./Count";
import Divider from "@mui/material/Divider";
import EditableText from "./EditableText/EditableText";
import EnumSelect from "./EnumSelect";
import FlagIcon from "./FlagIcon";
import Grid from "@mui/material/Grid";
import Highlight from "./Highlight";
import Logo from "./Logo";
import NavLink from "./NavLink";
import PhyloPics from "./PhyloPics";
import RecordLabel from "./RecordLabel";
import RecordLink from "./RecordLink";
import Report from "./Report";
import ResultCount from "./ResultCount";
import SearchIcon from "@mui/icons-material/Search";
import StaticPlot from "./StaticPlot";
import TextField from "@mui/material/TextField";
import Toggle from "./Toggle";
import Tooltip from "./Tooltip";
import TranslatedValue from "./TranslatedValue";
import ValueRow from "./ValueRow";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import YAML from "js-yaml";
import classNames from "classnames";
import classnames from "classnames";
import { compose } from "redux";
import gfm from "remark-gfm";
import { gridPropNames } from "../functions/propNames";
import { h } from "hastscript";
import qs from "qs";
import rehypeRaw from "rehype-raw";
import rehypeReact from "rehype-react";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import withPages from "../hocs/withPages";
import withStyles from "@mui/styles/withStyles";

const pagesUrl = PAGES_URL;
const webpackHash = COMMIT_HASH || __webpack_hash__;

const styleMap = {
  centerContentStyle,
  paddedStyle,
  negativePaddedStyle,
  unpaddedParagraphStyle,
  paragraphStyle,
  inlineStyle,
  unpaddedStyle,
};

export const Template = ({
  id,
  title,
  description,
  url,
  toggleFunction,
  ...props
}) => {
  const [values, setValues] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  if (typeof url === "object") {
    url = `${url.path}?${Object.entries(url)
      .filter(([k, v]) => k != "path")
      .map(([k, v]) => `${k}=${v}`)
      .join("&")}`;
  }

  useEffect(() => {
    if (url) {
      let matches = url
        .match(/\{.+?\}/g)
        .map((el) => el.replaceAll(/[\{\}]/g, ""))
        .sort()
        .filter((el, i, arr) => i == arr.indexOf(el));
      let exampleValues = {};
      for (let match of matches) {
        let example = props.hasOwnProperty(match)
          ? props[`${match}`]
          : props[`${match}_example`];
        exampleValues[match] = example;
      }
      setValues(exampleValues);
    }
  }, [url]);

  const handleChange = (e, queryProp, value, i) => {
    if (value) {
      // use given value
    } else if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
      value = e.target.value;
    } else {
      value = "";
    }
    setValues({ ...values, [queryProp]: value, focus: i });
  };

  const handleKeyPress = (e) => {
    if (e.key == "Enter" || e.keyCode == 13) {
      handleSubmit(e);
    }
  };

  const handleSubmit = (e) => {
    e && e.preventDefault();
    let [path, queryString] = url.split(/[\?#]/);
    for (let [key, value] of Object.entries(values)) {
      queryString = queryString.trim().replaceAll(`{${key}}`, value);
    }
    let options = queryString.split("&");
    let newOptions = [`searchTemplate=${id}`];
    for (let [key, val] of Object.entries(values)) {
      newOptions.push(`${key}=${val}`);
    }
    options.splice(1, 0, ...newOptions);
    let newQueryString = options
      .map((p) => encodeURIComponent(p.replace(/=/, "____")))
      .join("&")
      .replaceAll("____", "=");
    navigate(`${path}?${newQueryString}`);
  };

  if (!url) {
    return (
      <Nested
        pageId={`templates/${id}.md`}
        toggleFunction={toggleFunction}
        {...props}
      />
    );
  }
  if (!values || Object.keys(values).length == 0) {
    return null;
  }
  // let css;
  let matches = url
    .match(/\{.+?\}/g)
    .map((el) => el.replaceAll(/[\{\}]/g, ""))
    .sort()
    .filter((el, i, arr) => i == arr.indexOf(el));
  let inputs = [];
  for (let i = 0; i < matches.length; i++) {
    let match = matches[i];
    let label = props[`${match}_label`];
    let description = props[`${match}_description`];
    let input = (
      <EditableText
        variant="standard"
        // id={match + Math.random()}
        title={label}
        description={description}
        value={values[match] || ""}
        style={{ width: "95%" }}
        underline={true}
        onChange={(value) => handleChange(undefined, match, value, i)}
        // onBlur={(value) => handleChange(undefined, match, value, i)}
        fontFamily="Roboto, Helvetica, Arial, sans-serif"
        // onKeyUp={handleKeyPress}
        // autoFocus={i == values.focus}
      />
    );
    inputs.push(
      <Grid key={match} size={12}>
        <Tooltip title={description} arrow>
          {input}
        </Tooltip>
      </Grid>,
    );
  }
  let preview;
  if (showPreview) {
    let searchUrl = url;
    for (let [key, value] of Object.entries(values)) {
      searchUrl = searchUrl.replaceAll(`{${key}}`, value);
    }
    let reportProps = qs.parse(decodeURI(searchUrl.split(/[\?#]/)[1]));
    if (reportProps.report) {
      preview = (
        <Grid size={12}>
          <Report {...reportProps} caption={" "}></Report>
        </Grid>
      );
    } else {
      preview = (
        <Grid size={12}>
          <ResultCount {...reportProps} caption={" "}></ResultCount>
        </Grid>
      );
    }
  }
  return (
    <Grid container direction="column" spacing={1}>
      <Grid>
        <h2>{title}</h2>
        {description}
      </Grid>
      {showPreview && preview}
      {inputs}
      <Grid container direction="row" spacing={1} justifyContent="flex-end">
        {toggleFunction && (
          <Grid key={"toggle"}>
            <ColorButton
              variant="contained"
              disableElevation
              startIcon={<ArtTrackIcon />}
              onClick={(e) => {
                e.preventDefault();
                toggleFunction();
              }}
            >
              Template
            </ColorButton>
          </Grid>
        )}
        <Grid key={"preview"}>
          <ColorButton
            variant="contained"
            disableElevation
            startIcon={showPreview ? <VisibilityOffIcon /> : <VisibilityIcon />}
            onClick={(e) => {
              e.preventDefault();
              setShowPreview(!showPreview);
            }}
          >
            {showPreview ? "Hide Preview" : "Preview"}
          </ColorButton>
        </Grid>
        <Grid key={"submit"}>
          <ColorButton
            variant="contained"
            disableElevation
            startIcon={<SearchIcon />}
            onClick={handleSubmit}
          >
            Search
          </ColorButton>
        </Grid>
      </Grid>
    </Grid>
  );
};

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
        for (let part of parts[i].split("|")) {
          if (extra.hasOwnProperty(part)) {
            parts[i] = lower ? extra[part].toLowerCase() : extra[part];
            break;
          } else {
            parts[i] = "";
          }
        }
      }
      value = parts.join("");
    }
  }
  return value;
};

export const processProps = ({ props, extra = {}, newProps = {}, isGrid }) => {
  for (let [key, value] of Object.entries(props || {})) {
    if (isGrid && !gridPropNames.has(key)) {
      continue;
    }
    if (value === false) {
      newProps[key] = value;
    } else if (value == "") {
      newProps[key] = true;
    } else if (key == "className") {
      newProps["className"] = styleMap[`${value}Style`];
    } else if (key.startsWith("exclude")) {
      newProps[key] = Array.isArray(value) ? value : value.split(",");
    } else if (key == "src") {
      if (PAGES_URL.startsWith("http")) {
        newProps["src"] = `${pagesUrl}${value.replace(/^\/static/, "")}`;
      } else {
        newProps["src"] = value.replace(
          /^\/static\//,
          `${basename}/static/${webpackHash}/`,
        );
      }
    } else if (key == "size") {
      newProps["size"] = value * 1;
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
    badge: (props) => <Badge {...processProps({ props, extra })} />,
    breadcrumbs: (props) => <Breadcrumbs {...props} />,
    count: (props) => <Count {...processProps({ props, extra })} />,
    divider: (props) => (
      <Divider
        orientation={props.orientation || "vertical"}
        flexItem
        className={dividerStyle}
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
          <div className={fixedArStyle} style={{ background: fillColor }}>
            <Logo {...{ lineColor, fillColor }} />
          </div>
        </Grid>
      );
    },
    iframe: (props) => {
      let { size = 12, aspectRatio, ...iframeProps } = props;
      return (
        <Grid size={size}>
          <div style={{ aspectRatio }}>
            <iframe
              {...processProps({ props: iframeProps })}
              width={"100%"}
              height={"100%"}
            />
          </div>
        </Grid>
      );
    },
    img: (props) => (
      <div className={centerContentStyle}>
        <img {...processProps({ props })} alt={props.alt.toString()} />
      </div>
    ),
    include: (props) => {
      let nested = <Nested pgId={props.pageId} {...props} />;
      let css = reportContainerStyle;
      if (props.className) {
        css = classnames(
          reportContainerStyle,
          styleMap[`${props.className}Style`],
        );
      }

      return (
        <Grid {...processProps({ props, isGrid: true })} className={css}>
          {nested}
        </Grid>
      );
    },
    item: (props) => (
      <Grid
        {...processProps({ props, isGrid: true })}
        className={reportContainerStyle}
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
              className={reportContainerStyle}
            />
          );
        } else if (className == "language-template") {
          return (
            <Grid {...processProps({ props: nestedProps, isGrid: true })}>
              <Template
                {...processProps({ props: { ...nestedProps, ...extra } })}
              />
            </Grid>
          );
        }
      }
      return <Highlight {...processProps({ props })} />;
    },
    phylopic: (props) => <PhyloPics {...processProps({ props, extra })} />,
    recordlabel: (props) => <RecordLabel {...processProps({ props, extra })} />,
    recordlink: (props) => <RecordLink {...processProps({ props, extra })} />,
    report: (props) => {
      let css = reportContainerStyle;
      if (props.className) {
        css = classnames(
          reportContainerStyle,
          styleMap[`${props.className}Style`],
        );
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
    static: (props) => {
      let css = reportContainerStyle;
      if (props.className) {
        css = classnames(
          reportContainerStyle,
          styleMap[`${props.className}Style`],
        );
      }
      return (
        <Grid {...processProps({ props, isGrid: true })}>
          <StaticPlot {...processProps({ props, extra })} className={css} />
        </Grid>
      );
    },
    templat: (props) => (
      <Template
        {...processProps({ props })}
        className={classNames(reportContainerStyle, unpaddedStyle)}
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
    valuerow: (props) => <ValueRow {...processProps({ props, extra })} />,
  };
};

export function compile(val, components = RehypeComponentsList()) {
  const processor = unified()
    .use(remarkParse, { fragment: true })
    // .use(remarkReact, React)
    .use(gfm)
    .use(remarkDirective)
    .use(htmlDirectives)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeReact, {
      Fragment,
      jsx,
      jsxs,
      components,
      passNode: true,
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
      (node) => ondirective(node, index),
    );
  }

  function ondirective(node, index) {
    let data = node.data || (node.data = {});
    // Sanitize tag name: ensure valid HTML tag or fallback to span
    const isValidTagName = (name) =>
      typeof name === "string" && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name);
    const tagName = isValidTagName(node.name) ? node.name : "span";
    let hast = h(tagName, node.attributes);
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
  }, [pgId, pageId, pagesIsFetching, pagesById]);
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
    },
  );
  let css;
  if (siteStyles) {
    css = classes.root;
  } else {
    css = classnames(markdownStyle, classes.root);
  }
  return <div className={css}>{contents}</div>;
};

export const Nested = compose(withPages, withStyles(styleMap))(Markdown);

export default compose(withPages, withStyles(styleMap))(Markdown);
