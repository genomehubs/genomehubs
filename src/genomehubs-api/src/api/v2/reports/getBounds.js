import { chainQueries, getResults } from "../functions/getResults.js";

import { attrTypes } from "../functions/attrTypes.js";
import { fmt } from "./fmt.js";
import { getCatLabels } from "./getCatLabels.js";
import { incrementDate } from "./incrementDate.js";
import { scales } from "./scales.js";
import { setAggs } from "./setAggs.js";
import { setScale } from "./setScale.js";
import { setTerms } from "./setTerms.js";
import { valueTypes } from "./valueTypes.js";

export const getCatsBy = async ({
  terms,
  fixedTerms,
  field,
  result,
  taxonomy,
  apiParams,
}) => {
  let cats, by;
  if (terms.by_lineage) {
    cats = terms.by_lineage.at_rank.taxa.buckets;
    cats = await getCatLabels({
      cat: field,
      result,
      cats,
      taxonomy,
      apiParams,
    });
    by = "lineage";
  } else {
    if (
      terms.by_attribute.by_cat.by_value &&
      terms.by_attribute.by_cat.by_value.cats
    ) {
      cats = terms.by_attribute.by_cat.by_value.cats.buckets;
      cats.forEach((obj) => {
        obj.label = obj.key;
        obj.key = obj.key.toLowerCase();
      });
    } else if (fixedTerms) {
      let usedTerms = new Set();
      cats = [];
      let i = 0;
      for (let { key } of fixedTerms.terms) {
        i++;
        if (i > fixedTerms.size) {
          break;
        }
        usedTerms.add(key.toLowerCase());
        cats.push({
          key: key.toLowerCase(),
          label: fixedTerms.translations[key],
        });
      }
      if (i < fixedTerms.size) {
        for (let obj of terms.by_attribute.by_cat.more_values.buckets) {
          if (!usedTerms.has(obj.key.toLowerCase())) {
            i++;
            usedTerms.add(obj.key.toLowerCase());
            cats.push({ key: obj.key.toLowerCase(), label: obj.key });
          }
          if (i >= fixedTerms.size) {
            break;
          }
        }
      }
    } else {
      // TODO: include defined terms in cat bounds
      cats = terms.by_attribute.by_cat.more_values.buckets.map(
        // cats = Object.keys(terms.by_attribute.by_cat.by_value.buckets).map(
        (obj) => ({
          key: obj.key.toLowerCase(),
          label: obj.key,
        })
      );
    }

    by = "attribute";
  }

  return { cats, by };
};

const addNullToOpts = ({ opts, nullFields, field, showOther }) => {
  if (nullFields.includes(field) && !opts.match(/\bnull\b/)) {
    let parts = opts.split(/;/);
    if (parts.length == 1) {
      parts = parts[0].split(/,/);
    }
    let values = parts[0].split(/\*,\*/);
    values.push("null");
    if (!parts[2] || !parts[2].match(/\+/)) {
      let count = parts[2] || 5;
      parts[2] = `${count}+`;
    }

    opts = values.join(",") + ";" + parts.slice(1).join(";");
    return { opts, showOther: true };
  }
  return { opts, showOther };
};

export const getBounds = async ({
  params,
  fields,
  summaries,
  cat,
  result,
  exclusions,
  tickCount = 11,
  taxonomy,
  apiParams,
  opts = ";;",
  catOpts = ";;",
}) => {
  let showOther = false;
  let { lookupTypes } = await attrTypes({ result, taxonomy });
  let fieldMeta = lookupTypes(fields[0]);
  let { type, name: field } = fieldMeta;
  let { nullFields = [] } = params;
  if (cat) {
    if (cat.match(/\+/)) {
      showOther = true;
      cat = cat.replace(/\+/, "");
    }
    ({ opts: catOpts, showOther } = addNullToOpts({
      opts: catOpts,
      nullFields,
      field: cat,
      showOther,
    }));
  } else {
    ({ opts: catOpts, showOther } = addNullToOpts({
      opts,
      nullFields,
      field,
      showOther,
    }));
  }
  let nSort = false;
  if (opts.startsWith("nsort")) {
    nSort = true;
    opts = opts.replace("nsort", "");
  }
  params.size = 0;
  for (let [p, v] of Object.entries(apiParams)) {
    if (p.match(/query[A-Z]$/)) {
      params[p] = v;
    }
  }
  params.query = await chainQueries(params);
  // find max and min plus most frequent categories
  let catType;
  let catMeta = lookupTypes(cat);
  if (catMeta) {
    cat = catMeta.name;
  }
  let summary = summaries[0] || "value";
  let scaleType = setScale({ field, lookupTypes, opts });
  if (scaleType == "ordinal" && summary == "length") {
    scaleType = "linear";
  }
  let fixedTerms = await setTerms({
    cat: field,
    opts: catOpts,
    lookupTypes,
    taxonomy,
    apiParams,
  });
  let definedTerms = await setTerms({
    cat,
    opts: catOpts,
    lookupTypes,
    taxonomy,
    apiParams,
  });
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
  catMeta = lookupTypes(cat);
  let catTerm;
  if (catMeta) {
    if (fields.length > 0) {
      fields.push(catMeta.name);
      catTerm = catMeta.name;
    } else {
      catTerm = catMeta.name;
    }
    catType = catMeta.processed_type;
  }
  let extra = {};
  let valueKey = summary == "value" ? `${fieldMeta.type}_value` : summary;
  if (fieldMeta) {
    if (fieldMeta.type == "keyword") {
      if (summary == "length") {
        extra = { stats: true };
      } else {
        extra = { keywords: field };
      }
    } else if (fieldMeta.type == "geo_point") {
      extra = { geo: true };
    } else {
      extra = { stats: true };
    }
    if (fieldMeta.type == "date") {
      if (valueKey == "min") {
        valueKey = "from";
      } else if (valueKey == "max") {
        valueKey = "to";
      }
    }
  }

  params.aggs = await setAggs({
    field,
    summary,
    result,
    taxonomy,
    valueKey,
    ...extra,
    fixedTerms,
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
  let catAggs;
  let domain;
  try {
    aggs = res.aggs.aggregations[term] || res.aggs.aggregations[catTerm];
  } catch (err) {
    return;
  }

  let min, max;
  if (opts) {
    opts = opts.split(/\s*;\s*/);
    if (opts.length == 1) {
      opts = opts[0].split(/\s*,\s*/);
    }
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
  let { stats } = aggs;
  if (stats) {
    // Set domain to nice numbers
    if (!min || !max) {
      let valueType = valueTypes[fieldMeta.type] || "float";
      if (valueType == "keyword" && scaleType != "ordinal") {
        valueType = "integer";
      }
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
      } else if (fieldMeta.type == "date") {
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
    if (fieldMeta.type != "date" && !isNaN(min) && !isNaN(max)) {
      domain = [min, max].map((v) => v * 1);
    }
  } else {
    let { keywords } = aggs;
    if (keywords) {
      let { cats, by } = await getCatsBy({
        terms: keywords,
        fixedTerms,
        field,
        result,
        taxonomy,
        apiParams,
      });
      if (nSort) {
        cats = cats.sort((a, b) => a.key.localeCompare(b.key));
      }
      stats = {
        cats,
        by,
        count: res.status.hits,
        size: fixedTerms.size,
        showOther: fixedTerms.other,
      };
    } else {
      stats = { count: res.status.hits };
    }
    let { geo } = aggs;
    if (geo) {
      stats = stats || {};
      stats.geo = geo;
    }
  }
  let { terms } = aggs;
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
        obj.label = definedTerms.translations[obj.key] || obj.key;
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
    query: params.query,
    stats,
    type,
    domain,
    tickCount,
    cat,
    catType,
    cats,
    by,
    showOther,
  };
};
