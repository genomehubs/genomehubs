import { createSelector } from "reselect";
import qstr from "qs";

// const translations = {
//   caption: {
//     key: "cp",
//   },
//   excludeAncestral: {
//     key: "an",
//     flatten: true,
//   },
//   excludeDescendant: {
//     key: "de",
//     flatten: true,
//   },
//   excludeDirect: {
//     key: "di",
//     flatten: true,
//   },
//   excludeMissing: {
//     key: "mi",
//     flatten: true,
//   },
//   includeEstimates: {
//     // key: "o",
//     values: {
//       true: "E",
//       false: "e",
//     },
//   },
//   rank: {
//     key: "r",
//   },
//   report: {
//     key: "rp",
//     values: {
//       histogram: "h",
//       map: "m",
//       scatter: "s",
//       table: "ta",
//       tree: "t",
//       arc: "p",
//     },
//   },
//   result: {
//     key: "i",
//     values: {
//       assembly: "a",
//       analysis: "n",
//       feature: "f",
//       file: "i",
//       taxon: "t",
//     },
//   },
//   stacked: {
//     // key: "o",
//     values: {
//       true: "S",
//       false: "s",
//     },
//   },
//   taxonomy: {
//     key: "tx",
//   },
// };

const translations = {
  report: {
    key: "report",
    values: {
      arc: "xInY",
    },
  },
};

const translate = createSelector(() => {
  let shorter = {};
  let longer = {};
  Object.entries(translations).forEach(([param, obj]) => {
    let key = obj.key || "_";
    shorter[param] = { key };
    longer[key] = { key: obj.key ? param : "options" };
    if (obj.flatten) {
      shorter[param].flatten = true;
      longer[key].flatten = true;
    }
    if (obj.values) {
      Object.entries(obj.values).forEach(([long, short]) => {
        shorter[param][long] = short;
        longer[key][short] = { key: param, value: long };
      });
    }
  });
  const shorten = (param, value) => {
    if (!value) {
      return shorter[param] ? shorter[param].key : param;
    }
    let v = value;
    if (shorter[param]) {
      v = shorter[param][value] || value;
      if (shorter[param].flatten && Array.isArray(v)) {
        v = v.join(",");
      }
    }
    return v;
  };
  const expand = (param, value) => {
    if (!value) {
      return longer[param] ? longer[param].key : param;
    }
    let v = value;
    if (longer[param]) {
      v = longer[param][value] || value;
      if (longer[param].flatten) {
        v = v.split(",");
      }
    }
    return v;
  };
  return {
    shorten,
    expand,
  };
});

const expandOptions = (obj, opts) => {
  let expanded = {};
  const tr = translate();
  Object.entries(obj).forEach(([param, value]) => {
    if (typeof value !== "undefined") {
      let p = tr.expand(param);
      let v = tr.expand(param, value);
      if (typeof v === "object" && v.key) {
        expanded[v.key] = v.value;
      } else {
        expanded[p] = v;
      }
    }
  });
  return expanded;
};

const qs = {
  parse: (input, opts) => parse(input, opts),
  expand: (input, opts) => expandOptions(input, opts),
};

export default qs;
