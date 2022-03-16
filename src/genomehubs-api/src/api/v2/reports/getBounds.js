import { attrTypes } from "../functions/attrTypes";
import { fmt } from "./fmt";
import { getCatLabels } from "./getCatLabels";
import { getResults } from "../functions/getResults";
import { incrementDate } from "./incrementDate";
import { scales } from "./scales";
import { setAggs } from "./setAggs";
import { setScale } from "./setScale";
import { setTerms } from "./setTerms";
import { valueTypes } from "./valueTypes";

export const getCatsBy = async ({
  terms,
  field,
  result,
  taxonomy,
  apiParams,
}) => {
  let cats, by;
  if (terms.by_lineage) {
    cats = terms.by_lineage.at_rank.taxa.buckets;
    cats = await getCatLabels({ field, result, cats, taxonomy, apiParams });
    by = "lineage";
  } else {
    cats = terms.by_attribute.by_cat.cats.buckets;
    cats.forEach((obj) => {
      obj.label = obj.key;
    });
    by = "attribute";
  }
  return { cats, by };
};

export const getBounds = async ({
  params,
  fields,
  summaries,
  cat,
  result,
  exclusions,
  tickCount = 10,
  taxonomy,
  apiParams,
  opts,
}) => {
  let typesMap = await attrTypes({ result, taxonomy });
  params.size = 0;
  // find max and min plus most frequent categories
  let field = fields[0];
  let summary = summaries[0];
  let scaleType = setScale({ field, typesMap, opts });
  let definedTerms = await setTerms({ cat, typesMap, taxonomy, apiParams });
  cat = definedTerms.cat;
  let extraTerms;
  if (definedTerms.terms) {
    if (definedTerms.terms.length < definedTerms.size) {
      extraTerms = cat;
    }
  } else {
    extraTerms = cat;
  }
  let term = field;
  if (cat && typesMap[cat]) {
    if (fields.length > 0) {
      fields.push(cat);
    } else {
      term = cat;
    }
  }
  params.aggs = await setAggs({
    field,
    summary,
    result,
    taxonomy,
    ...(typesMap[field].type != "keyword" && { stats: true }),
    ...(typesMap[field].type == "keyword" && { keywords: field }),
    terms: extraTerms,
    size: definedTerms.size,
  });
  let res = await getResults({
    ...params,
    taxonomy,
    fields,
    exclusions,
  });
  let aggs;
  let domain;
  try {
    aggs = res.aggs.aggregations[term];
  } catch {
    return;
  }
  let stats = aggs.stats;
  if (stats) {
    // Set domain to nice numbers
    let min, max;
    if (opts) {
      opts = opts.split(",");
      if (opts[0] && opts[0] > "") {
        min = opts[0];
      }
      if (opts[1] && opts[1] > "") {
        max = opts[1];
      }
      if (opts[2] && opts[2] > "") {
        tickCount = Math.abs(opts[2]);
      }
    }
    if (!min || !max) {
      let valueType = valueTypes[typesMap[field].type] || "float";
      if (stats.min == stats.max) {
        tickCount = 2;
        if (valueType == "date") {
          min = stats.min;
          max = incrementDate(stats.max);
        } else if (valueType == "float" || valueType == "integer") {
          min = Number.parseFloat(stats.min).toPrecision(3);
          if (min > stats.min) {
            let [val, exp] = min.split("e");
            min = val.split("");
            for (let i = min.length - 1; i >= 0; i--) {
              if (min[i] == 0) {
                min[i] = 9;
              } else if (min[i] != ".") {
                min[i] = min[i] * 1 - 1;
                break;
              }
            }
            min = min.join("");
            if (exp) {
              min += `e${exp}`;
            }
          }
          let [val, exp] = min.split("e");
          max = val.split("");
          for (let i = max.length - 1; i >= 0; i--) {
            if (i > 0 && max[i] == 9) {
              max[i] = 0;
            } else if (max[i] != ".") {
              max[i] = max[i] * 1 + 1;
              break;
            }
          }
          max = max.join("");
          if (exp) {
            max += `e${exp}`;
          }
        }
      } else if (typesMap[field].type == "date") {
        min = stats.min;
        max = stats.max;
        if (max > min + 31536000000) {
          max = new Date(`${new Date(stats.max).getFullYear() + 1}`).getTime();
        }
      } else {
        let tmpMin = typeof min == "undefined" ? stats.min : min;
        let tmpMax = typeof max == "undefined" ? stats.max : max;
        // if (scaleType.startsWith("log") && tmpMin == 0) {
        //   tmpMin = 1;
        // }
        let scale = scales[scaleType]().domain([tmpMin, tmpMax]);
        let ticks = scale.ticks(tickCount);
        let gap = ticks[1] - ticks[0];
        let lastTick = ticks[ticks.length - 1];
        if (typeof min == "undefined") {
          min = 1 * fmt(ticks[0] - gap * Math.ceil((ticks[0] - tmpMin) / gap));
          if ((scaleType.startsWith("log") && min == 0) || isNaN(min)) {
            min = tmpMin;
          }
        }
        max =
          1 *
          fmt(
            lastTick + gap * Math.max(Math.ceil((tmpMax - lastTick) / gap), 1)
          );
      }
    }
    domain = [min, max];
  } else {
    let keywords = aggs.keywords;
    if (keywords) {
      let { cats, by } = await getCatsBy({
        terms: keywords,
        field,
        result,
        taxonomy,
        apiParams,
      });
      stats = { cats, by, count: res.status.hits };
    } else {
      stats = { count: res.status.hits };
    }
  }
  let terms = aggs.terms;
  let cats;
  let by;
  if (terms) {
    ({ cats, by } = await getCatsBy({
      terms,
      field: cat,
      result,
      taxonomy,
      apiParams,
    }));
  }
  if (definedTerms && definedTerms.terms) {
    let definedCats = [...definedTerms.terms];
    let catKeys = {};
    definedCats.forEach((obj) => {
      catKeys[obj.key] = true;
      if (!obj.label) {
        obj.label = obj.key;
      }
    });
    if (cats) {
      for (let i = 0; i < cats.length; i++) {
        let obj = cats[i];
        if (!catKeys[obj.key]) {
          definedCats.push(obj);
        }
        if (definedCats.length == definedTerms.size) {
          break;
        }
      }
    }
    cats = definedCats;
    by = definedTerms.by;
  }
  return {
    field,
    scale: scaleType,
    stats,
    domain,
    tickCount,
    cat,
    cats,
    by,
    showOther: definedTerms.other,
  };
};
