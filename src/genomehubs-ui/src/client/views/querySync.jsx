import { batchActions } from "redux-batched-actions";
import convert from "color-convert";
// import { getQueryValue } from "./reducers/location";
import { history } from "./reducers/history";
import qs from "./functions/qs";

export const userColors = [
  "rgb(166,206,227)",
  "rgb(31,120,180)",
  "rgb(178,223,138)",
  "rgb(51,160,44)",
  "rgb(251,154,153)",
  "rgb(227,26,28)",
  "rgb(253,191,111)",
  "rgb(255,127,0)",
  "rgb(202,178,214)",
  "rgb(106,61,154)",
];

export const colorToRGB = (color) => {
  if (color.match("rgb")) {
    return color;
  } else if (color.match("hsl")) {
    color = color.replace("hsl(", "").replace(")", "").split(",");
    color = convert.hsl.rgb(color);
  } else if (color.match("#")) {
    color = color.replace("#", "");
    color = convert.hex.rgb(color);
  } else if (color.match("hex")) {
    color = color.replace("hex", "");
    color = convert.hex.rgb(color);
  } else {
    color = convert.keyword.rgb(color);
  }
  if (color) {
    color = "rgb(" + color.join() + ")";
  }
  return color;
};

export const colorToHex = (color) => {
  if (color.match("#")) {
    return color.replace("#", "hex");
  } else if (color.match("hsl")) {
    color = color.replace("hsl(", "").replace(")", "").split(",");
    color = convert.hsl.hex(color);
  } else if (color.match("rgba")) {
    color = color.replace("rgba(", "").replace(")", "").split(",");
    color = convert.rgb.hex(color.slice(0, 3));
  } else if (color.match("rgb")) {
    color = color.replace("rgb(", "").replace(")", "").split(",");
    color = convert.rgb.hex(color);
  } else {
    color = convert.keyword.hex(color);
  }
  if (color) {
    color = "hex" + color;
  }
  return color;
};

export const defaultTransform = {
  x: 0,
  order: 1,
  factor: 0,
  intercept: 0,
  origin: { x: 0, y: 0 },
  index: -1,
};

const keyed = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

const mapDispatchToQuery = {
  palette: {
    type: "SELECT_PALETTE",
    payload: (k, v) => v,
    default: "default",
  },
  pngResolution: {
    type: "SET_PNG_RESOLUTION",
    payload: (k, v) => v,
    default: 2000,
  },
  userColors: {
    actions: (k, v) => [
      {
        type: "EDIT_PALETTE",
        payload: (k, v) => {
          let user = [];
          v.forEach((o) => {
            user[o.index] = colorToRGB(o.value);
          });
          return { id: "user", user };
        },
      },
    ],
  },
  color0: {
    array: (k, v) => ({ key: "userColors", index: 0, value: v }),
    default: userColors[0],
  },
  color1: {
    array: (k, v) => ({ key: "userColors", index: 1, value: v }),
    default: userColors[1],
  },
  color2: {
    array: (k, v) => ({ key: "userColors", index: 2, value: v }),
    default: userColors[2],
  },
  color3: {
    array: (k, v) => ({ key: "userColors", index: 3, value: v }),
    default: userColors[3],
  },
  color4: {
    array: (k, v) => ({ key: "userColors", index: 4, value: v }),
    default: userColors[4],
  },
  color5: {
    array: (k, v) => ({ key: "userColors", index: 5, value: v }),
    default: userColors[5],
  },
  color6: {
    array: (k, v) => ({ key: "userColors", index: 6, value: v }),
    default: userColors[6],
  },
  color7: {
    array: (k, v) => ({ key: "userColors", index: 7, value: v }),
    default: userColors[7],
  },
  color8: {
    array: (k, v) => ({ key: "userColors", index: 8, value: v }),
    default: userColors[8],
  },
  color9: {
    array: (k, v) => ({ key: "userColors", index: 9, value: v }),
    default: userColors[9],
  },
};

// export const defaultValue = (param) =>
//   mapDispatchToQuery[param].default || false;

// export const qsDefault = (param) => {
//   console.log(param);
//   console.log(getQueryValue);
//   console.log(defaultValue);
//   return getQueryValue(param) || defaultValue(param);
// };

export const queryToStore = (options = {}) => {
  return function (dispatch) {
    // dispatch({type:'RELOADING',payload:true})
    let batch = [];
    let values = options.values || {};
    let searchReplace = options.searchReplace || false;
    let currentHash = options.hash || history.location.hash || "";
    let currentSearch = options.currentSearch || history.location.search || "";
    let remove = options.remove || [];
    let action = options.action || "REPLACE";
    let arrays = {};
    let parsed = qs.parse(currentSearch.replace("?", ""));
    Object.keys(parsed).forEach((key) => {
      if (parsed[key] == "") {
        delete parsed[key];
        remove.push(key);
      }
    });
    if (keyed(values, "colors")) {
      let oldCols = values.colors.existing.colors;
      let newCols = values.colors.colors[values.colors.colors.id];
      newCols.forEach((col, i) => {
        let hex = colorToHex(newCols[i]);
        if (hex != colorToHex(oldCols[i])) {
          values["color" + i] = hex;
        }
      });
      delete values.colors;
    }
    if (Object.keys(parsed).length > 0 && searchReplace) {
      Object.keys(parsed).forEach((key) => {
        if (!keyed(values, key)) {
          let [f, k, x] = key.split("--");
          if (!x) {
            k = k || key;
            if (keyed(mapDispatchToQuery, k)) {
              let obj = mapDispatchToQuery[k];
              if (keyed(obj, "default")) {
                values[key] = obj.default;
                remove.push(key);
              } else {
                // console.log(key)
              }
            }
          }
        }
      });
      parsed = {};
    } else if (searchReplace) {
      Object.keys(mapDispatchToQuery).forEach((key) => {
        if (!keyed(values, key)) {
          if (keyed(mapDispatchToQuery[key], "type")) {
            remove.push(key);
          }
        }
      });
    }
    Object.keys(values).forEach((key) => {
      let value = values[key];
      let [field, k, x] = key.split("--");
      if (!x) {
        let fullKey = key;
        if (k) {
          key = k;
          value = { value, field };
        }
        if (keyed(mapDispatchToQuery, key)) {
          let obj = mapDispatchToQuery[key];
          let actions = [];
          if (keyed(obj, "array")) {
            let entry = obj.array(key, value);
            if (!keyed(arrays, entry.key)) {
              arrays[entry.key] = [];
            }
            arrays[entry.key].push(entry);
          } else if (keyed(obj, "actions")) {
            actions = obj.actions(key, value);
          } else {
            actions = [{ ...obj }];
          }
          actions.forEach((action) => {
            let type = action.type;
            let payload = action.payload(key, value);
            //dispatch({type,payload})
            batch.push({ type, payload });
          });
          if (keyed(obj, "params")) {
            let params = obj.params(key, value);
            Object.keys(params).forEach((k) => {
              parsed[k] = params[k];
            });
          } else {
            if (k) {
              parsed[fullKey] = values[fullKey];
            } else {
              parsed[key] = value;
            }
          }
        } else {
          parsed[key] = value;
        }
      }
    });
    Object.keys(arrays).forEach((key) => {
      let value = arrays[key];
      if (keyed(mapDispatchToQuery, key)) {
        let obj = mapDispatchToQuery[key];
        let actions = [];
        if (keyed(obj, "actions")) {
          actions = obj.actions(key, value);
        } else {
          actions.push(obj);
        }
        actions.forEach((action) => {
          let type = action.type;
          let payload = action.payload(key, value);
          //dispatch({type,payload})
          batch.push({ type, payload });
        });
        if (keyed(obj, "params")) {
          let params = obj.params(key, value);
          Object.keys(params).forEach((k) => {
            parsed[k] = params[k];
          });
        }
      }
    });
    arrays = {};
    remove.forEach((key) => {
      let value = values[key];
      let [field, k] = key.split("--");
      delete parsed[key];
      if (k) {
        key = k;
        value = { value, field };
      }
      if (keyed(mapDispatchToQuery, key)) {
        let obj = mapDispatchToQuery[key];
        let actions = [];
        if (keyed(obj, "array")) {
          let entry = obj.array(key, value);
          if (!keyed(arrays, entry.key)) {
            arrays[entry.key] = [];
          }
          arrays[entry.key].push(entry);
        } else if (keyed(obj, "actions")) {
          actions = obj.actions(key, value);
        } else {
          actions = [{ ...obj }];
        }
        actions.forEach((action) => {
          let type = action.type;
          let payload = action.default;
          //dispatch({type,payload})
          batch.push({ type, payload });
        });
      } else if (keyed(mapDispatchToQuery, k)) {
        let obj = mapDispatchToQuery[k];
        if (keyed(obj, "array")) {
          let entry = obj.array(k, value);
          if (!keyed(arrays, entry.key)) {
            arrays[entry.key] = [];
          }
          arrays[entry.key].push(entry);
        }
      }
    });
    Object.keys(arrays).forEach((key) => {
      let value = arrays[key];
      if (keyed(mapDispatchToQuery, key)) {
        let obj = mapDispatchToQuery[key];
        let actions = [];
        if (keyed(obj, "actions")) {
          actions = obj.actions(key, value);
        } else {
          actions.push(obj);
        }
        actions.forEach((action) => {
          let type = action.type;
          let payload = action.payload(key, value);
          //dispatch({type,payload})
          batch.push({ type, payload });
        });
        if (keyed(obj, "params")) {
          let params = obj.params(key, value);
          Object.keys(params).forEach((k) => {
            parsed[k] = params[k];
          });
        }
      }
    });

    let search = qs.stringify(parsed);
    if (search != currentSearch) {
      if (action != "POP") {
        history.push({ hash: currentHash, search });
      }
      // else if (action == 'FILTER'){
      //   history.push({hash:currentHash,search})
      // }
      //dispatch({type:'SET_QUERY_STRING',payload:search})
      batch.push({ type: "SET_QUERY_STRING", payload: search });
    }
    dispatch(batchActions(batch));
    return new Promise((resolve) => resolve(parsed));
  };
};

export default queryToStore;
