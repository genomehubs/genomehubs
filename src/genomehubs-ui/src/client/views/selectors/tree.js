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
  schemePaired,
  schemeReds,
} from "d3-scale-chromatic";

import { apiUrl } from "../reducers/api";
import axisScales from "../functions/axisScales";
import { createSelector } from "reselect";
import qs from "qs";
import store from "../store";

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

const test_condition = (meta, operator, value) => {
  if (!meta || !meta.value) {
    return false;
  }
  if (!value) {
    return true;
  }
  if (!operator) operator = "=";
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

const setColor = ({ node, yQuery, recurse }) => {
  let field = (yQuery?.yFields || [])[0];
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
    let status = node.status ? 1 : 0;
    if (node.fields && node.fields[field]) {
      source = node.fields[field].source;
      value = node.fields[field].value;
      min = node.fields[field].min;
      max = node.fields[field].max;
    }
    color = greys[baseTone + status];
    highlightColor = greys[baseTone + 1 + status];

    if (source == "direct") {
      if (status) {
        color = greens[baseTone + 2 + status * 2];
        highlightColor = greens[baseTone + 3 + status * 2];
      } else {
        color = greys[baseTone + 1];
        highlightColor = greys[baseTone + 1];
      }
    } else if (source == "descendant") {
      if (status) {
        color = oranges[baseTone + status * 2];
        highlightColor = oranges[baseTone + 2 + status * 2];
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

export const processTreeRings = ({ nodes, xQuery, yQuery }) => {
  if (!nodes) return undefined;
  let { treeNodes, lca } = nodes;
  if (!lca) return undefined;
  let { maxDepth, taxDepth, taxon_id: rootNode, parent: ancNode } = lca;
  maxDepth = taxDepth ? taxDepth : maxDepth;
  if (!treeNodes || !rootNode) return undefined;
  let radius = 498;
  let rScale = scalePow()
    .exponent(1)
    .domain([-0.5, maxDepth + 1])
    .range([0, radius]);
  let cMax = treeNodes[rootNode] ? treeNodes[rootNode].count : 0;
  let cScale = scaleLinear().domain([0, cMax]).range([-Math.PI, Math.PI]);
  let arcs = [];

  let scaleFont = false;
  let charLen = 8;
  let charHeight = charLen * 1.3;
  var radialLine = lineRadial()
    .angle((d) => d.a)
    .radius((d) => d.r);
  let visited = {};

  let labels = [];

  const drawArcs = ({ node, depth = 0, start = 0, recurse = true }) => {
    visited[node.taxon_id] = true;
    let outer = depth + 1;
    if (!node) return {};
    let { color, highlightColor } = setColor({ node, yQuery, recurse });

    if (
      !node.hasOwnProperty("children") ||
      Object.keys(node.children).length == 0
    ) {
      outer = maxDepth + 1;
    }
    let innerRadius = rScale(depth);
    let outerRadius = rScale(outer);
    let farOuterRadius = rScale(maxDepth + 1);
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
      start: start,
      depth: depth,
      color,
      highlightColor,
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
          if (scaleFont) labelScale = arcLen / labelLen;
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
        if (scaleFont) labelScale = radLen / labelLen;
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
                nextOpts
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
          b.scientific_name.localeCompare(a.scientific_name)
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
  drawArcs({ node: treeNodes[rootNode] });
  return { arcs, labels, maxDepth };
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

export const processTreePaths = ({
  nodes,
  bounds = {},
  yBounds = {},
  xQuery,
  yQuery,
}) => {
  if (!nodes) return undefined;
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
  let { treeNodes, lca } = nodes;
  let yField = (yQuery?.yFields || [])[0];
  let valueScale;
  let targetWidth = 1000;
  let dataWidth = 0;
  if (yBounds && yBounds.domain) {
    valueScale = axisScales[yBounds.scale]()
      .domain(yBounds.domain)
      .range([0, 100]);
    dataWidth = 120;
    targetWidth -= 120;
  }
  if (!lca) return undefined;
  let { maxDepth, taxDepth, taxon_id: rootNode, parent: ancNode } = lca;
  maxDepth = taxDepth ? taxDepth : maxDepth;
  if (!treeNodes || !rootNode) return undefined;
  let maxWidth = 0;
  let maxTip = 0;
  let charLen = 6.5;
  let charHeight = charLen * 2;
  let xScale = scaleLinear()
    .domain([-0.5, maxDepth + 2])
    .range([0, targetWidth]);
  let yMax = treeNodes[rootNode] ? treeNodes[rootNode].count : 0;
  let yScale = scaleLinear()
    .domain([0, yMax])
    .range([charHeight * (yMax + 2), 0]);
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
    if (!node) return {};
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
          a.scientific_name.localeCompare(b.scientific_name)
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
    });
    let bar = [];
    if (value) {
      if (typeof value === "number" && valueScale) {
        bar[0] = valueScale(value);
        if (min !== undefined) {
          bar[1] = valueScale(min);
        }
        if (max !== undefined) {
          bar[2] = valueScale(max);
        }
        value = bar[0] / 12.5;
      } else {
        value = 10;
      }
    }

    let label;
    if (node.tip) {
      label = node.scientific_name;
      maxWidth = Math.max(
        maxWidth,
        node.xEnd + 10 + node.scientific_name.length * charLen
      );
      maxTip = Math.max(maxTip, node.xEnd + 10);
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
            Math.floor(node.width / charLen) - 1
          )}...`;
        }
      }
    }

    locations[node.scientific_name.toLowerCase()] = {
      x: node.xStart,
      y: node.yStart,
      tip: node.tip ? node.width : false,
      width: node.tip ? node.scientific_name.length * charLen : node.width,
    };
    locations[node.taxon_id.toLowerCase()] = { x: node.xStart, y: node.yStart };

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
      labelWidth: label ? label.length * charLen : 0,
      color,
      highlightColor,
      source,
      value,
      bar,
    });
  });
  return {
    lines,
    maxDepth,
    maxWidth,
    maxTip,
    yField,
    dataWidth,
    plotHeight: yScale(0) - yScale(yMax) + charHeight / 2,
    charHeight,
    locations,
    other,
  };
};

export const processTree = ({
  nodes,
  bounds,
  yBounds,
  xQuery,
  yQuery,
  treeStyle = "rect",
}) => {
  if (treeStyle == "ring") {
    return processTreeRings({ nodes, bounds, yBounds, xQuery, yQuery });
  }
  return processTreePaths({ nodes, bounds, yBounds, xQuery, yQuery });
};
