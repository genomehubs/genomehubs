import {
  ancestralColor,
  descendantColor,
  descendantHighlight,
  directColor,
  directHighlight,
} from "../reducers/color";
import { arc, line as d3line, lineRadial } from "d3-shape";
import {
  cancelNodesRequest,
  getNodes,
  getRootNode,
  getTreeHighlight,
  receiveNodes,
  requestNodes,
  resetNodes,
  setRootNode,
  treeThreshold,
} from "../reducers/tree";
import { scaleLinear, scaleLog, scalePow } from "d3-scale";
import {
  schemeGreens,
  schemeGreys,
  schemeOranges,
  schemeReds,
} from "d3-scale-chromatic";

import { apiUrl } from "../reducers/api";
import axisScales from "../functions/axisScales";
import { formats } from "../functions/formats";
import qs from "../functions/qs";
import store from "../store";
import stringLength from "../functions/stringLength";

const uriEncode = (str) => {
  return encodeURIComponent(str).replaceAll(/[!'()*]/g, (c) => {
    return "%" + c.charCodeAt(0).toString(16);
  });
};

export function fetchNodes(options) {
  return async function (dispatch) {
    if (!options.hasOwnProperty("query")) {
      dispatch(cancelNodeRequest);
    }
    const state = store.getState();
    dispatch(requestNodes());
    let treeOptions = { ...options };
    delete treeOptions.ranks;
    treeOptions.offset = 0;
    treeOptions.size = treeThreshold;
    const queryString = qs.stringify(treeOptions);
    let x = uriEncode(treeOptions.query);
    let y = "";
    if (treeOptions.y) {
      y = `&y=${uriEncode(treeOptions.y)}`;
    }
    let url = `${apiUrl}/report?report=tree&x=${x}${y}&result=${treeOptions.result}&taxonomy=${treeOptions.taxonomy}&includeEstimates=${treeOptions.includeEstimates}`;
    try {
      let json;
      try {
        const response = await fetch(url);
        json = await response.json();
      } catch (error) {
        json = console.log("An error occured.", error);
      }
      dispatch(receiveNodes(json));
    } catch (err) {
      dispatch(cancelNodesRequest());
    }
  };
}

const deepGet = (obj, path, value) => {
  let parts = path.split(".");
  let retVal = obj;
  for (let i = 0; i < parts.length; i++) {
    if (retVal.hasOwnProperty(parts[i])) {
      retVal = retVal[parts[i]];
    } else {
      return value;
    }
  }
  return retVal;
};

const isNumeric = (n) => {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

const compare = {
  ">": (a, b) => a > b,
  ">=": (a, b) => a >= b,
  "<": (a, b) => a < b,
  "<=": (a, b) => a <= b,
  "=": (a, b) => (Array.isArray(a) ? a.includes(b) : a == b),
  "==": (a, b) => (Array.isArray(a) ? a.includes(b) : a == b),
  contains: (a, b) =>
    Array.isArray(a) ? a.some((value) => value.includes(b)) : a.includes(b),
};

const test_condition = (meta, operator = "=", value) => {
  if (!meta || !meta.value) {
    return false;
  }
  if (!value) {
    return true;
  }
  return compare[operator](meta.value, value);
};

const outerArc = ({ innerRadius, outerRadius, startAngle, endAngle }) => {
  let arcAttrs = arc()({
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
  }).split(/[A-Z]/);
  return `M${arcAttrs[1]}A${arcAttrs[2]}`;
};

export const getAPITreeNodes = getNodes;

const setColor = ({ node, yQuery, recurse, hideSourceColors }) => {
  let field = (yQuery?.yFields || [])[0];
  let summary = (yQuery?.ySummaries || ["value"])[0];
  let color, highlightColor;
  let tonalRange = 9;
  let baseTone = 2;
  let greys = schemeGreys[tonalRange];
  let reds = schemeReds[tonalRange];
  let greens = schemeGreens[tonalRange];
  let oranges = schemeOranges[tonalRange];
  let source;
  let value;
  let min;
  let max;
  if (!recurse) {
    color = "white";
    highlightColor = "white";
  } else if (yQuery) {
    let status = node.status ? 2 : hideSourceColors || !node.fields ? 2 : 1;
    if (node.fields && node.fields[field]) {
      source = node.fields[field].source;
      value = node.fields[field][summary];
      min = node.fields[field].min;
      max = node.fields[field].max;
    }
    // color = greys[baseTone + status];

    color =
      hideSourceColors ||
      !node.fields ||
      ["assembly", "sample"].includes(node.taxon_rank)
        ? greys[baseTone + status]
        : ancestralColor;
    highlightColor = greys[baseTone + 1 + status];

    if (!hideSourceColors && source == "direct") {
      if (status) {
        // color = greens[baseTone + 2 + status * 2];
        // highlightColor = greens[baseTone + 3 + status * 2];
        color = directColor;
        highlightColor = directHighlight;
      } else {
        color = greys[baseTone + 1];
        highlightColor = greys[baseTone + 1];
      }
    } else if (!hideSourceColors && source == "descendant") {
      if (status) {
        // color = oranges[baseTone + status * 2];
        highlightColor = oranges[baseTone + 2 + status * 2];
        color = descendantColor;
        highlightColor = descendantHighlight;
      } else {
        color = greys[baseTone + 1];
        highlightColor = greys[baseTone + 2];
      }
    }
  } else {
    color = greys[baseTone + 3];
    highlightColor = greys[baseTone + 4];
  }
  return { color, highlightColor, source, value, min, max };
};

export const circleXY = (r, theta) => {
  theta -= Math.PI / 2;
  return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
};

const updateDomain = ({ domain = [], field, summary, treeNodes }) => {
  let newDomain = [...domain];
  if (summary != "value") {
    newDomain = [];
    for (let node of Object.values(treeNodes)) {
      if (
        node.hasOwnProperty("children") &&
        Object.keys(node.children).length > 0
      ) {
        continue;
      }
      if (node.fields && node.fields[field]) {
        let value = node.fields[field][summary];
        if (isNumeric(value)) {
          if (newDomain.length == 0) {
            newDomain = [summary.endsWith("count") ? 0 : value, value];
          } else {
            newDomain[0] = Math.min(newDomain[0], value);
            newDomain[1] = Math.max(newDomain[1], value);
          }
        }
      }
    }
  }
  return newDomain;
};

export const processTreeRings = ({
  nodes,
  xQuery,
  bounds,
  yQuery,
  pointSize,
  yBounds,
  hideErrorBars,
  hideAncestralBars,
  hideSourceColors,
  showPhylopics,
}) => {
  if (!nodes) {
    return undefined;
  }
  let { treeNodes, lca } = nodes;
  if (!lca) {
    return undefined;
  }
  let { maxDepth, taxDepth, taxon_id: rootNode, parent: ancNode } = lca;
  maxDepth = taxDepth || maxDepth;
  if (!treeNodes || !rootNode) {
    return undefined;
  }
  const { cat, cats: catArray, showOther } = bounds || {};
  let cats = {};
  let other;
  if (catArray) {
    cats = {};
    catArray.forEach((cat, index) => {
      if (cat.key) {
        cats[cat.key] = index;
      }
    });
    if (showOther) {
      other = catArray.length;
      cats.other = other;
    }
  }
  let radius = 498;
  let yField = (yQuery?.yFields || [])[0];
  let valueScale;
  let dataWidth = 0;
  let ticks = [];
  let phylopics = {};
  let cMax = treeNodes[rootNode] ? treeNodes[rootNode].count : 0;
  let phylopicWidth = 0;
  if (showPhylopics) {
    phylopicWidth = Math.min((radius * Math.PI * 2) / cMax, 100);
    radius -= phylopicWidth;
  }
  let summary = (yQuery?.ySummaries || ["value"])[0];

  yBounds = yBounds
    ? structuredClone(yBounds)
    : {
        scale: "linear",
        domain: [],
      };

  let hideBar;

  if (summary.endsWith("count")) {
    yBounds.domain = [0, 1];
    yBounds.scale = "linear";
    yBounds.min = undefined;
    yBounds.max = undefined;
    hideBar = true;
  }
  let yDomain = yBounds && yBounds.domain;

  if (
    yDomain &&
    yDomain.length > 0 &&
    (yBounds.type != "date" || summary != "value")
  ) {
    yDomain = updateDomain({
      domain: yDomain,
      field: yField,
      summary,
      treeNodes,
    });
    valueScale = axisScales[yBounds.scale || "linear"]()
      .domain(yDomain)
      // .nice()
      .range([0, 100]);
    dataWidth = 120;
    radius -= 120;
    let tickMarks = valueScale.ticks();
    let mid = tickMarks[Math.floor(tickMarks.length / 2)];
    ticks.push({
      value: valueScale.domain()[0],
      label: formats(valueScale.domain()[0]),
      radius: radius + 10 + valueScale(valueScale.domain()[0]),
    });
    console.log({ radius, dataWidth, phylopicWidth });

    let arcString = arc()({
      innerRadius: radius + 10 + valueScale(mid),
      outerRadius: radius + 10 + valueScale(valueScale.domain()[1]),
      startAngle: -Math.PI,
      endAngle: Math.PI * 0.95,
    });
    let parts = arcString.split(/[MLZ]/);

    ticks.push({
      value: mid,
      label: formats(mid),
      radius: radius + 10 + valueScale(mid),
      arc: `M${parts[2]}`,
    });
    ticks.push({
      value: valueScale.domain()[1],
      label: formats(valueScale.domain()[1]),
      radius: radius + 10 + valueScale(valueScale.domain()[1]),
      arc: `M${parts[1]}`,
    });
  }

  let rScale = scalePow()
    .exponent(1)
    .domain([-0.5, maxDepth + 1])
    .range([0, radius]);
  let cScale = scaleLinear()
    .domain([0, dataWidth ? cMax * 1.025 : cMax])
    .range([-Math.PI, Math.PI]);
  let arcs = [];

  let scaleFont = false;
  let charHeight = pointSize;
  let charLen = charHeight / 1.3;
  let radialLine = lineRadial()
    .angle((d) => d.a)
    .radius((d) => d.r);
  let visited = {};

  let labels = [];

  const drawArcs = ({ node, depth = 0, start = 0, recurse = true }) => {
    visited[node.taxon_id] = true;
    let outer = depth + 1;
    if (!node) {
      return {};
    }
    let { color, highlightColor, source, value, min, max } = setColor({
      node,
      yQuery,
      recurse,
      hideSourceColors,
    });
    let bar = [];
    let scaledValue;
    if (!hideAncestralBars || (source && !source.includes("ancestor"))) {
      ({ scaledValue, bar } = setBar({
        node,
        value,
        min,
        max,
        valueScale,
        bar,
        ratio: [1, 100],
      }));
    }

    let cStart = start;
    let cEnd = start + node.count;
    if (cEnd - cStart == cMax) {
      cStart = cEnd * 0.0005;
      // cEnd -= cStart;
      cEnd *= 0.9995;
    }
    let startAngle = cScale(cStart);
    let endAngle = cScale(cEnd);
    let midAngle = (startAngle + endAngle) / 2;
    let barAngle =
      (Math.min(((cEnd - cStart) / cMax) * 360 * 0.25, 0.25) * Math.PI) / 180;
    let innerRadius = rScale(Math.max(depth, -0.5));
    if (
      !node.hasOwnProperty("children") ||
      Object.keys(node.children).length == 0
    ) {
      outer = maxDepth + 1;
    }
    if (
      node.taxon_rank != "assembly" &&
      (!node.hasOwnProperty("children") ||
        Object.keys(node.children).length == 0 ||
        node.hasAssemblies ||
        node.hasSamples)
    ) {
      if (node.taxon_id && showPhylopics && node.scientific_name != "parent") {
        let r = radius + dataWidth + phylopicWidth / 2;

        let width = (Math.PI * r * 2 * 0.9) / cMax;
        let height = phylopicWidth * 0.9;

        phylopics[node.taxon_id] = {
          angle: (midAngle * 180) / Math.PI,
          radius: r,
          scientificName: node.scientific_name,
          width,
          height,
          arc: arc()({
            innerRadius: radius + dataWidth,
            outerRadius: radius + dataWidth + phylopicWidth,
            startAngle,
            endAngle,
          }),
          ...circleXY(r, midAngle),
        };
      }
    }
    let outerRadius = rScale(outer);
    let farOuterRadius = rScale(maxDepth + 1);

    arcs.push({
      ...node,
      arc: arc()({
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
      }),
      highlight: arc()({
        innerRadius,
        outerRadius: farOuterRadius,
        startAngle,
        endAngle,
      }),
      cats: setCats({ node, cat, cats, other }),
      start: start,
      depth: depth,
      color,
      highlightColor,
      value,
      valueLabel: formats(value),
      ...((!node.children || Object.keys(node.children).length == 0) &&
        valueScale &&
        scaledValue && {
          valueArc: arc()({
            innerRadius: radius + 10,
            outerRadius: radius + 10 + valueScale(value),
            startAngle,
            endAngle,
          }),
          ...(!hideBar && {
            valueBar: arc()({
              innerRadius: radius + 10 + Math.max(bar[1], 0),
              outerRadius: radius + 10 + bar[2],
              startAngle: midAngle - barAngle,
              endAngle: midAngle + barAngle,
            }),
          }),
        }),
      bar,
    });

    const addlabel = (label, { truncate = false, stopIteration = false }) => {
      let nextOpts = { truncate, stopIteration };
      if (truncate) {
        nextOpts.stopIteration = true;
      } else {
        nextOpts.truncate = true;
      }
      let labelLen = charLen * label.length;
      let midRadius = (innerRadius + outerRadius) / 2;
      let arcLen = (endAngle - startAngle) * midRadius;
      let radLen = outerRadius - innerRadius;
      let labelScale = 1.1;
      if (arcLen > radLen) {
        if (labelLen < arcLen) {
          if (scaleFont) {
            labelScale = arcLen / labelLen;
          }
          let labelArc = outerArc({
            innerRadius: midRadius,
            outerRadius: midRadius,
            startAngle,
            endAngle,
          });
          labels.push({
            ...node,
            scientific_name: label,
            arc: labelArc,
            labelScale,
          });
        }
      } else if (arcLen > charHeight && labelLen <= radLen) {
        if (scaleFont) {
          labelScale = radLen / labelLen;
        }
        labels.push({
          ...node,
          scientific_name: label,
          arc: radialLine([
            { a: midAngle, r: innerRadius },
            { a: midAngle, r: outerRadius },
          ]),
          labelScale,
        });
      } else if (!stopIteration) {
        if (!truncate) {
          if (node.taxon_rank == "species") {
            let parts = label.split(" ");
            if (parts.length == 2) {
              addlabel(`${parts[0].charAt(0)}. ${parts[1]}`, nextOpts);
            }
          } else if (node.taxon_rank == "subspecies") {
            let parts = label.split(" ");
            if (parts.length == 3) {
              addlabel(
                `${parts[0].charAt(0)}. ${parts[1].charAt(0)}. ${parts[2]}`,
                nextOpts,
              );
            }
          } else {
            addlabel(label, nextOpts);
          }
        } else {
          let maxLen = Math.max(arcLen, radLen) / charLen;
          maxLen -= 3;
          if (maxLen > 5) {
            addlabel(`${label.substring(0, maxLen)}...`, nextOpts);
          }
        }
      }
    };
    if (depth >= 0) {
      addlabel(node.scientific_name, {});
    }

    if (recurse && node.hasOwnProperty("children")) {
      let children = [];
      Object.keys(node.children).forEach((key) => {
        children.push(treeNodes[key]);
      });
      children.sort(
        (a, b) =>
          a.count - b.count ||
          b.scientific_name.localeCompare(a.scientific_name),
      );
      children.forEach((child) => {
        // test if node has been visited already - indicates problem with tree
        if (!visited[child.taxon_id]) {
          drawArcs({ node: child, depth: depth + 1, start });
        } else {
          console.warn("Tree node already visited");
          console.warn(node);
        }
        start += child.count;
      });
    }
  };

  drawArcs({
    node: {
      taxon_id: ancNode,
      count: treeNodes[rootNode] ? treeNodes[rootNode].count : 1,
      scientific_name: "parent",
    },
    depth: -1,
    recurse: false,
  });
  if (treeNodes[rootNode]) {
    drawArcs({ node: treeNodes[rootNode] });
  }
  return {
    arcs,
    labels,
    maxDepth,
    cats: [...(catArray || [])].concat(
      other ? [{ key: "other", label: "other" }] : [],
    ),
    ticks,
    other,
    phylopics,
  };
};

export const setCats = ({ node, cats, cat, other }) => {
  if (!cat) {
    return;
  }
  if (node.fields && node.fields[cat]) {
    let catList = node.fields[cat].value;
    if (!Array.isArray(catList)) {
      return typeof cats[catList.toLowerCase()] === "number"
        ? [cats[catList.toLowerCase()]]
        : other
          ? [other]
          : [];
    } else {
      let nodeCats = [];
      let hasOther;
      for (let nodeCat of catList) {
        let catString = nodeCat.toLowerCase();
        if (catString == "other") {
          if (hasOther) {
            continue;
          }
          hasOther = true;
        }
        let catIndex = cats[catString];
        if (typeof catIndex === "number") {
          nodeCats.push(catIndex);
        } else if (other && !hasOther) {
          nodeCats.push(other);
          hasOther = true;
        }
      }
      return nodeCats.sort((a, b) => a - b);
    }
  } else if (node.cat) {
    let nodeCat = node.cat;
    return typeof cats[nodeCat.toLowerCase()] === "number"
      ? [cats[nodeCat.toLowerCase()]]
      : other
        ? [other]
        : [];
  }
};

const setBar = ({
  node,
  value,
  min,
  max,
  valueScale,
  bar,
  ratio = [12.5, 10],
}) => {
  let scaledValue = value;
  if (valueScale && value) {
    if (typeof value === "number" && valueScale) {
      bar[0] = valueScale(value);
      if (min !== undefined) {
        bar[1] = valueScale(min);
      }
      if (max !== undefined) {
        bar[2] = valueScale(max);
      }
      value = bar[0] / ratio[0];
    } else {
      value = ratio[1];
    }
  }
  return { scaledValue, bar };
};

export const processTreePaths = ({
  nodes,
  bounds = {},
  yBounds = {},
  yQuery,
  pointSize,
  hideErrorBars,
  showPhylopics,
  hideAncestralBars,
  hideSourceColors,
}) => {
  if (!nodes) {
    return undefined;
  }
  let charHeight = pointSize;
  const { cat, cats: catArray, showOther } = bounds;
  let cats = {};
  let other;
  if (catArray) {
    cats = {};
    catArray.forEach((cat, index) => {
      if (cat.key) {
        cats[cat.key] = index;
      }
    });
    if (showOther) {
      other = catArray.length;
      cats.other = other;
    }
  }
  let { treeNodes, lca } = structuredClone(nodes);
  let yField = (yQuery?.yFields || [])[0];
  let valueScale;
  let targetWidth = 1000;
  let dataWidth = 0;

  let phylopics = {};
  let phylopicWidth = 0;

  if (showPhylopics) {
    phylopicWidth = charHeight * 1.5;
    targetWidth -= phylopicWidth;
  }
  let summary = (yQuery?.ySummaries || ["value"])[0];
  yBounds = yBounds
    ? structuredClone(yBounds)
    : {
        scale: "linear",
        domain: [],
      };

  let hideBar;

  if (summary.endsWith("count")) {
    yBounds.domain = [0, 1];
    yBounds.scale = "linear";
    yBounds.min = undefined;
    yBounds.max = undefined;
    hideBar = true;
  }
  let yDomain = yBounds && yBounds.domain;
  if ((yDomain && yBounds.type != "date") || summary != "value") {
    yDomain = updateDomain({
      domain: yDomain,
      field: yField,
      summary,
      treeNodes,
    });
    valueScale = axisScales[yBounds.scale]()
      .domain(yDomain)
      // .nice()
      .range([0, 100]);
    dataWidth = 120;
    targetWidth -= 120;
  }
  if (!lca) {
    return undefined;
  }
  let { maxDepth, taxDepth, taxon_id: rootNode, parent: ancNode } = lca;
  maxDepth = taxDepth || maxDepth;
  if (!treeNodes || !rootNode) {
    return undefined;
  }
  let maxWidth = 0;
  let maxTip = 0;
  let charLen = charHeight / 1.6;
  let xScale = scaleLinear()
    .domain([-0.5, maxDepth + 2])
    .range([0, targetWidth]);
  let yMax = treeNodes[rootNode] ? treeNodes[rootNode].count : 0;
  let yScale = scaleLinear()
    .domain([0, yMax])
    .range([charHeight * (yMax + 3), charHeight]);
  let lines = [];
  let visited = {};

  let pathNodes = {};
  let sortOrder = [];
  const setXCoords = ({
    node,
    depth = 0,
    recurse = true,
    parent = ancNode,
  }) => {
    if (!node) {
      return {};
    }
    visited[node.taxon_id] = true;

    let rightDepth = depth + 1;
    let xStart = Math.max(0, xScale(depth));
    let xEnd = xScale(rightDepth);
    if (node.children) {
      node.childCount = Object.keys(node.children).length;
    }
    let pathNode = {
      ...node,
      depth,
      xStart,
      xEnd,
      cats: setCats({ node, cat, cats, other }),
      width: xEnd - xStart,
      parent,
      yCoords: [],
    };
    pathNodes[node.taxon_id] = pathNode;
    sortOrder.unshift(node.taxon_id);

    if (recurse && node.children && node.childCount > 0) {
      let children = [];
      Object.keys(node.children).forEach((key) => {
        children.push(treeNodes[key]);
      });
      children.sort(
        (b, a) =>
          b.count - a.count ||
          a.scientific_name.localeCompare(b.scientific_name),
      );
      for (let child of children) {
        if (!visited[child.taxon_id]) {
          setXCoords({
            node: treeNodes[child.taxon_id],
            depth: depth + 1,
            parent: node.taxon_id,
          });
        } else {
          console.warn("Tree node already visited");
          console.warn(child);
        }
      }
    }
  };
  if (treeNodes[rootNode]) {
    treeNodes[ancNode] = {
      ...treeNodes[rootNode],
      children: { [treeNodes[rootNode].taxon_id]: true },
      taxon_id: ancNode,
      count: treeNodes[rootNode].count,
      scientific_name: "parent",
    };
    setXCoords({
      node: treeNodes[ancNode || rootNode],
      depth: ancNode ? -1 : 0,
    });
  }
  let y = 0;
  let locations = {};

  sortOrder.forEach((nodeId) => {
    let node = pathNodes[nodeId];
    let rawY, minY, maxY, tip;
    if (node.yCoords.length == 0) {
      rawY = y;
      minY = rawY - 0.5;
      maxY = rawY + 0.5;
      node.tip = true;
      y++;
    } else if (node.yCoords.length == 1 || node.scientific_name == "parent") {
      rawY = node.yCoords[0];
      minY = rawY - 0.5;
      maxY = rawY + 0.5;
    } else {
      node.yCoords = node.yCoords.sort((a, b) => a - b);
      minY = node.yCoords[0];
      maxY = node.yCoords[node.yCoords.length - 1];
      rawY = (minY + maxY) / 2;
    }
    if (node.parent && pathNodes[node.parent]) {
      pathNodes[node.parent].yCoords.push(rawY);
    }
    node.yStart = yScale(rawY);
    node.yMin = yScale(maxY);
    node.yMax = yScale(minY);
    node.height = node.yMax - node.yMin;
    let { color, highlightColor, source, value, min, max } = setColor({
      node,
      yQuery,
      recurse: true,
      hideSourceColors,
    });
    let bar = [];
    let scaledValue;
    ({ scaledValue, bar } = setBar({
      node,
      value,
      min,
      max,
      valueScale,
      bar,
    }));

    if (node.tip) {
      let width = phylopicWidth;
      let height = node.yMax - node.yMin;

      phylopics[node.taxon_id] = {
        scientificName: node.scientific_name,
        width,
        height,
        x: targetWidth - dataWidth,
        y: node.yMin,
      };
    }

    let label;
    let showPhylopic;
    if (node.tip) {
      label = node.scientific_name;
      maxWidth = Math.max(maxWidth, stringLength(label) * pointSize * 0.8);
      maxTip = Math.max(maxTip, node.xEnd + 10);
      showPhylopic = showPhylopics && node.scientific_name != "parent";
    } else if (node.scientific_name != "parent" && node.width > charLen * 5) {
      label = node.scientific_name;
      if (label.length * charLen - 2 > node.width) {
        if (node.taxon_rank == "species") {
          let parts = label.split(" ");
          if (parts.length == 2) {
            label = `${parts[0].charAt(0)}. ${parts[1]}`;
          }
        }
        if (label.length * charLen - 2 > node.width) {
          label = `${label.substring(
            0,
            Math.floor(node.width / charLen) - 1,
          )}...`;
        }
      }
    }
    locations[node.scientific_name.toLowerCase()] = {
      x: node.xStart,
      y: node.yStart,
      tip: node.tip ? node.width : false,
      width: node.tip
        ? stringLength(node.scientific_name) * pointSize * 0.8
        : node.width,
    };
    locations[node.taxon_id.toLowerCase()] = { x: node.xStart, y: node.yStart };
    if (hideAncestralBars && source && source.includes("ancestor")) {
      bar = undefined;
    }
    lines.push({
      ...node,
      hLine: d3line()([
        [node.xStart, node.yStart],
        [node.xEnd, node.yStart],
      ]),
      ...(node.yCoords.length > 1 &&
        (node.scientific_name == "parent"
          ? {
              vLine: d3line()([
                [node.xStart + charHeight / 1.5, node.yMin],
                [node.xStart, node.yStart],
                [node.xStart + charHeight / 1.5, node.yMax],
              ]),
            }
          : {
              vLine: d3line()([
                [node.xEnd, node.yMin],
                [node.xEnd, node.yMax],
              ]),
            })),
      label,
      labelWidth: label ? stringLength(label) * pointSize * 0.8 : 0,
      color,
      highlightColor,
      source,
      value: scaledValue,
      bar,
      showPhylopic,
    });
  });
  maxWidth += maxTip + pointSize / 2;
  return {
    lines,
    maxDepth,
    maxWidth,
    maxTip,
    yField,
    valueScale,
    dataWidth,
    plotHeight: yScale(0) - yScale(yMax) + charHeight / 2 + charHeight,
    charHeight,
    locations,
    other,
    // cats: bounds.cats,
    cats: [...(catArray || [])].concat(
      other ? [{ key: "other", label: "other" }] : [],
    ),
    // phylopics,
    phylopicWidth,
  };
};

export const processTree = ({
  nodes,
  bounds,
  yBounds,
  xQuery,
  yQuery,
  treeStyle = "rect",
  pointSize = 15,
  hideErrorBars,
  showPhylopics,
  hideAncestralBars,
  hideSourceColors,
}) => {
  if (treeStyle == "ring") {
    return processTreeRings({
      nodes,
      bounds,
      yBounds,
      xQuery,
      yQuery,
      pointSize,
      hideErrorBars,
      hideAncestralBars,
      hideSourceColors,
      showPhylopics,
    });
  }
  return processTreePaths({
    nodes,
    bounds,
    yBounds,
    xQuery,
    yQuery,
    pointSize,
    hideErrorBars,
    hideAncestralBars,
    hideSourceColors,
    showPhylopics,
  });
};
