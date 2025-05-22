import { format } from "d3-format";
import { processDoc } from "./processDoc.js";
import { scaleFuncs } from "../queries/histogramAgg.js";
import { subsets } from "./subsets.js";
import { utcFormat } from "d3-time-format";

const sci = (v) => {
  if (v < 1000 && v >= 0.001) {
    if (v < 10) {
      return format(".3r")(v).replace(/0*$/, "");
    }
    return format(".3r")(v);
  }
  return format(".3s")(v);
};
const sciInt = (v) => {
  if (v < 1000) {
    return Math.ceil(v);
  }
  return format(".3s")(v);
};

const parseNamesIdentifiers = ({ names, hit, field, hitField, result }) => {
  if (hit.inner_hits && hit.inner_hits[hitField] && names) {
    let parsed = {};
    hit.inner_hits[hitField].hits.hits.forEach((obj) => {
      let hitNames = parsed[obj.fields[`${hitField}.class`]] || {};
      Object.keys(obj.fields).forEach((key) => {
        let k = key.replace(`${hitField}.`, "").replace(".raw", "");
        if (k == "name") {
          if (!hitNames[k]) {
            hitNames[k] = obj.fields[key];
          } else {
            hitNames[k].push(...obj.fields[key]);
          }
        } else {
          hitNames[k] = obj.fields[key];
        }
      });

      parsed[obj.fields[`${hitField}.class`]] = hitNames;
    });
    result[field] = parsed;
  }
};

export const processHits = ({
  body,
  names,
  ranks,
  fields = [],
  lookupTypes,
  reason,
  lca,
  inner_hits,
  processAsDoc,
  bounds,
}) => {
  let results = [];
  let targetFields = {};
  let fieldTypes = {};
  for (let field of fields) {
    let meta = lookupTypes(field);
    let defaultSummary = meta ? meta.processed_simple : "value";
    let [attr, suffix = defaultSummary] = field.split(":");
    if (!targetFields[attr]) {
      targetFields[attr] = [];
    }
    targetFields[attr].push(suffix);
    if (meta) {
      fieldTypes[attr] = meta.processed_type;
    }
  }
  let buckets = {};

  const deepFind = (obj, key) => {
    let value;
    Object.keys(obj).some((k) => {
      if (k === key) {
        value = obj[k];
        return true;
      }
      if (obj[k] && typeof obj[k] === "object") {
        value = deepFind(obj[k], key);
        return value !== undefined;
      }
    });
    return value;
  };

  const setBucketValues = (value, bucketType, scaleFunc) => {
    let bucketValues = deepFind(value, "buckets").map((b) => b.key);
    let bucketLabels, hasRange;
    if (bucketType == "date") {
      bucketLabels = bucketValues.map(
        (v) => new Date(v).toISOString().split("T")[0]
        // .replace(/(-01)*$/g, "")
      );
      hasRange = true;
    } else if (!bucketType.endsWith("keyword") && bucketType == "geo_hex") {
      bucketLabels = bucketValues.map((v) =>
        bucketType == "date" ? v : sci(scaleFunc(v))
      );
      hasRange = true;
    } else {
      bucketLabels = bucketValues;
    }
    if (hasRange) {
      bucketLabels = bucketLabels.map((v, i) => {
        if (i == bucketLabels.length - 1) {
          return ">" + v;
        } else {
          return `${v}–${bucketLabels[i + 1]}`;
        }
      });
    }
    return { values: bucketValues, labels: bucketLabels };
  };

  for (let [key, value] of Object.entries(
    body.aggregations ? body.aggregations.fields || {} : {}
  )) {
    let bucketKey = key.replace(/_histogram$/, "");
    if (fieldTypes[bucketKey] && key.endsWith("_histogram")) {
      buckets[bucketKey] = setBucketValues(
        value,
        fieldTypes[bucketKey],
        scaleFuncs[`${bounds[bucketKey].scale || "linear"}Inv`]
      );
    }
  }
  body.hits.hits.forEach((hit) => {
    let result = {
      index: hit._index,
      id: hit._id,
      score: hit._score,
      result: hit._source,
    };
    if (processAsDoc) {
      result.result = processDoc({
        doc: hit._source,
        inner_hits: hit.inner_hits,
      });
    } else {
      result.result = hit._source;
      parseNamesIdentifiers({
        names,
        hit,
        field: "names",
        hitField: "taxon_names",
        result: result.result,
      });
      parseNamesIdentifiers({
        names,
        hit,
        field: "names",
        hitField: "identifiers",
        result: result.result,
      });
      // if (hit.inner_hits && hit.inner_hits.taxon_names && names) {
      //   let taxonNames = {};
      //   hit.inner_hits.taxon_names.hits.hits.forEach((obj) => {
      //     let hitNames = taxonNames[obj.fields["taxon_names.class"]] || {};
      //     Object.keys(obj.fields).forEach((key) => {
      //       let k = key.replace("taxon_names.", "").replace(".raw", "");
      //       if (k == "name") {
      //         if (!hitNames[k]) {
      //           hitNames[k] = obj.fields[key];
      //         } else {
      //           hitNames[k].push(obj.fields[key]);
      //         }
      //       } else {
      //         hitNames[k] = obj.fields[key];
      //       }
      //     });

      //     taxonNames[obj.fields["taxon_names.class"]] = hitNames;
      //   });
      //   result.result.names = taxonNames;
      // }
      // if (hit.inner_hits && hit.inner_hits.identifiers && names) {
      //   let recordNames = {};
      //   hit.inner_hits.identifiers.hits.hits.forEach((obj) => {
      //     let hitNames = {};
      //     Object.keys(obj.fields).forEach((key) => {
      //       hitNames[key.replace("identifiers.", "").replace(".raw", "")] =
      //         obj.fields[key];
      //     });
      //     recordNames[obj.fields["identifiers.class"]] = hitNames;
      //   });
      //   result.result.names = recordNames;
      // }
      if (hit.inner_hits && hit.inner_hits.lineage) {
        if (ranks) {
          let taxonRanks = {};
          hit.inner_hits.lineage.hits.hits.forEach((obj) => {
            let hitRanks = {};
            Object.keys(obj.fields).forEach((key) => {
              let value = obj.fields[key];
              if (Array.isArray(value) && value.length == 1) {
                value = value[0];
              }
              hitRanks[key.replace("lineage.", "").replace(".raw", "")] = value;
            });
            taxonRanks[obj.fields["lineage.taxon_rank"]] = hitRanks;
          });
          result.result.ranks = taxonRanks;
        }
        if (lca) {
          let lineage = [];
          for (let obj of hit.inner_hits.lineage.hits.hits) {
            // lineage.push(obj.fields["lineage.taxon_id"][0]);
            lineage.push({
              taxon_rank:
                obj.fields["lineage.taxon_rank"] &&
                obj.fields["lineage.taxon_rank"][0],
              taxon_id:
                obj.fields["lineage.taxon_id"] &&
                obj.fields["lineage.taxon_id"][0],
              scientific_name:
                obj.fields["lineage.scientific_name.raw"] &&
                obj.fields["lineage.scientific_name.raw"][0],
              node_depth:
                obj.fields["lineage.node_depth"] &&
                obj.fields["lineage.node_depth"][0],
            });
            if (
              lca.taxon_id &&
              obj.fields["lineage.taxon_id"] &&
              obj.fields["lineage.taxon_id"][0] == lca.taxon_id
            ) {
              break;
            }
          }

          result.result.lineage = lineage;
        }
      }
      if (result.result.attributes) {
        let fields = {};
        result.result.attributes.forEach((attribute) => {
          let name;
          let field = {};
          Object.keys(attribute).forEach((key) => {
            if (key == "key") {
              name = attribute[key];
            } else if (key.match(/_value$/)) {
              if (key == "is_primary_value") {
                field.is_primary = Boolean(attribute.is_primary_value);
              } else {
                field.value = attribute[key];
              }
            } else if (key == "values") {
              field.rawValues = attribute[key].map((value) => {
                let retValue = {};
                Object.keys(value).forEach((vkey) => {
                  if (vkey.match(/_value$/)) {
                    if (vkey == "is_primary_value") {
                      retValue.is_primary = Boolean(value.is_primary_value);
                    } else {
                      retValue.value = value[vkey];
                    }
                  } else {
                    retValue[vkey] = value[vkey];
                  }
                });
                return retValue;
              });
            } else {
              field[key] = attribute[key];
            }
          });

          if (name) {
            fields[name] = field;
          }
        });
        if (Object.keys(fields).length > 0) {
          result.result.fields = fields;
        }
        delete result.result.attributes;
      }
    }
    if (reason && hit.inner_hits) {
      let reason = [];
      Object.keys(hit.inner_hits).forEach((key) => {
        hit.inner_hits[key].hits.hits.forEach((inner_hit) => {
          reason.push({ score: inner_hit._score, fields: inner_hit.fields });
        });
      });
      if (reason.length > 0) {
        result.reason = reason;
      }
    }
    if (inner_hits && hit.inner_hits) {
      let fields = {};
      let attrFields = result.result.fields || {};
      Object.keys(hit.inner_hits).forEach((key) => {
        hit.inner_hits[key].hits.hits.forEach((inner_hit) => {
          let name;
          let field = {};
          if (inner_hit.fields) {
            Object.keys(inner_hit.fields).forEach((ikey) => {
              if (ikey.match(/\.key$/)) {
                name = inner_hit.fields[ikey][0];
              } else if (ikey.match(/_value$/) || ikey.match(/_value.raw$/)) {
                if (inner_hit.fields[ikey].length == 1) {
                  field.value = inner_hit.fields[ikey][0];
                } else {
                  field.value = inner_hit.fields[ikey];
                }
              } else if (ikey == "attributes.aggregation_source") {
                if (
                  Array.isArray(inner_hit.fields[ikey]) &&
                  inner_hit.fields[ikey].includes("direct")
                ) {
                  field[ikey.replace(/attributes\./, "")] = "direct";
                  if (inner_hit.fields[ikey].includes("descendant")) {
                    field.has_descendants = true;
                  }
                } else {
                  field[ikey.replace(/attributes\./, "")] =
                    inner_hit.fields[ikey];
                }
              } else if (inner_hit.fields[ikey].length == 1) {
                field[ikey.replace(/attributes\./, "")] =
                  inner_hit.fields[ikey][0];
              } else {
                field[ikey.replace(/attributes\./, "")] =
                  inner_hit.fields[ikey];
              }
            });
          }
          if (name) {
            if (attrFields[name]) {
              field = { ...attrFields[name], ...field };
            }
            if (targetFields[name]) {
              for (let subset of targetFields[name]) {
                let subsetKey = subset;
                if (fieldTypes[name] == "date") {
                  if (subsetKey == "min") {
                    subsetKey = "from";
                  } else if (subsetKey == "max") {
                    subsetKey = "to";
                  }
                  try {
                    if (field[subsetKey].endsWith("T00:00:00.000Z")) {
                      field[subsetKey] = field[subsetKey].replace(
                        "T00:00:00.000Z",
                        ""
                      );
                    }
                  } catch {
                    if (field.value.endsWith("T00:00:00.000Z")) {
                      field.value = field.value.replace("T00:00:00.000Z", "");
                    }
                  }
                }

                let newName = name;
                let meta = lookupTypes(name);
                let defaultSummary = meta ? meta.processed_simple : "value";
                if (subset != defaultSummary) {
                  newName += `:${subset}`;
                }
                if (subsets.source.has(subsetKey)) {
                  let agg_sources = field.aggregation_source;
                  if (!Array.isArray(agg_sources)) {
                    agg_sources = [agg_sources];
                  }
                  if (
                    subset == "estimate" &&
                    agg_sources.some((s) => subsets.estimate.has(s))
                  ) {
                    fields[newName] = field;
                  } else if (agg_sources.some((s) => s == subset)) {
                    fields[newName] = field;
                  }
                } else if (subsets.summary.has(subsetKey)) {
                  fields[newName] = { ...field, value: field[subsetKey] };
                }
                if (newName != name) {
                  fields[name][subsetKey] = field[subsetKey];
                }
              }
            } else {
              fields[name] = field;
            }
          }
        });
      });
      if (Object.keys(fields).length > 0) {
        for (let [name, obj] of Object.entries(fields)) {
          if (buckets[name]) {
            let value = Array.isArray(obj.value) ? obj.value : [obj.value];

            obj.binned = [
              ...new Set(
                value
                  .map((v) => {
                    if (
                      !fieldTypes[name].endsWith("keyword") &&
                      !fieldTypes[name] == "geo_hex"
                    ) {
                      let i;
                      let val = fieldTypes[name] == "date" ? Date.parse(v) : v;
                      for (let [index, bucket] of buckets[
                        name
                      ].values.entries()) {
                        if (
                          bucket <
                          scaleFuncs[bounds[name].scale || "linear"](val)
                        ) {
                          i = index;
                        } else {
                          break;
                        }
                      }
                      return buckets[name].labels[i];
                    } else {
                      return buckets[name].values.includes(v.toLowerCase())
                        ? v
                        : "Other";
                    }
                  })
                  .sort()
              ),
            ];
          }
        }
        result.result.fields = fields;
      }
    }
    results.push(result);
  });
  return results;
};
