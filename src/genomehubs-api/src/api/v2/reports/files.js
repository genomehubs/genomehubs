import { attrTypes } from "../functions/attrTypes";
import { getResultCount } from "../functions/getResultCount";
import { getResults } from "../functions/getResults";
import { nullCountsAgg } from "../queries/queryFragments/nullCountsAgg";
import { parseFields } from "../functions/parseFields";
import { processHits } from "../functions/processHits";
import { queryParams } from "./queryParams";
import { setExclusions } from "../functions/setExclusions";

const getFileMatrix = async ({
  result,
  taxonomy,
  xQuery,
  apiParams,
  req,
  meta,
}) => {
  let xRes = await getResults({
    ...xQuery,
    size: 0,
    taxonomy,
    req,
    // update: "x",
  });
  if (!xRes.status.success) {
    return { status: xRes.status };
  }
  let { query } = xRes;

  let aggs = await nullCountsAgg({
    fields: xQuery.fields,
  });
  let { buckets } = xRes.aggs.fields.by_key.buckets.files.value_list;
  let template = aggs.fields.aggs.by_key.aggs.value_list;

  let counts = {};
  let { file_paths: filePaths } = meta;
  // console.log(filePaths);

  for (let { key, doc_count } of buckets) {
    if (filePaths[key] == null) {
      continue;
    }
    counts[key] = doc_count;
    aggs.fields.aggs.by_key.aggs[`value_list_${key}`] = {
      terms: { ...template.terms, field: `attributes.metadata.${key}.run` },
    };
    aggs.fields.aggs.by_key.aggs[`file_list_${key}`] = {
      terms: {
        ...template.terms,
        field: `attributes.metadata`,
        include: Object.keys(filePaths[key] || []),
      },
    };
  }
  let x2Res = await getResults({
    ...xQuery,
    aggs,
    size: 0,
    taxonomy,
    req,
    // update: "x",
  });
  let matrix = {};
  for (let [key, count] of Object.entries(counts)) {
    matrix[key] = { count, runs: {}, files: {} };
    let { buckets: runBuckets } =
      x2Res.aggs.fields.by_key.buckets.files[`value_list_${key}`];
    for (let { key: run, doc_count: runCount } of runBuckets) {
      matrix[key].runs[run] = { count: runCount };
      // aggs.fields.aggs.by_key.aggs[`value_list_${key}_${run}`] = {
      //   terms: {
      //     ...template.terms,
      //     field: `attributes.metadata.${key}.${run}`,
      //   },
      // };
    }
    let { buckets: fileBuckets } =
      x2Res.aggs.fields.by_key.buckets.files[`file_list_${key}`];
    for (let { key: file, doc_count: fileCount } of fileBuckets) {
      matrix[key].files[file] = { count: fileCount };
    }
  }

  return { matrix, status: xRes.status, query };

  // // files by name
  // aggs.fields.aggs.by_key.aggs[`value_list_name`] = {
  //   terms: {
  //     ...template.terms,
  //     field: `attributes.metadata`,
  //     include: Object.keys(filePaths.busco),
  //   },
  // };
  // let x3Res = await getResults({
  //   ...xQuery,
  //   query: `${xQuery.query} AND metadata(files)=full_table,short_summary`,
  //   aggs,
  //   size: 0,
  //   taxonomy,
  //   req,
  //   // update: "x",
  // });
  // console.log(aggs.fields.aggs.by_key.aggs.value_list_name);
  // console.log(x3Res.aggs.fields.by_key.buckets.files.value_list_name.buckets);

  // files per run
  // let x3Res = await getResults({
  //   ...xQuery,
  //   aggs,
  //   size: 0,
  //   taxonomy,
  //   req,
  //   // update: "x",
  // });
  // for (let [key, count] of Object.entries(counts)) {
  //   console.log({ [key]: count });
  //   let { buckets: runBuckets } =
  //     x2Res.aggs.fields.by_key.buckets.files[`value_list_${key}`];
  //   for (let { key: run, doc_count: runCount } of runBuckets) {
  //     console.log({ run, runCount });
  //     let { buckets: fileBuckets } =
  //       x3Res.aggs.fields.by_key.buckets.files[`value_list_${key}_${run}`];
  //     for (let { key: file, doc_count: fileCount } of fileBuckets) {
  //       console.log({ file, fileCount });
  //     }
  //   }
  // }

  // console.log(meta);

  // console.log(xRes.aggs.fields.by_key.buckets.files.value_list.buckets);

  // console.log(xRes.results[0].result.fields.files);
};

const getFileLinks = async ({
  result,
  taxonomy,
  xQuery,
  fileTerm,
  apiParams,
  req,
  meta,
  size = 10,
  offset = 0,
  lookupTypes,
  query,
}) => {
  let fileRes = await getResults({
    ...xQuery,
    ...(fileTerm && {
      query: `${xQuery.query} AND ${fileTerm}`,
      fields: xQuery.fields.concat([fileTerm.split("=")[0]]),
    }),
    size,
    offset,
    taxonomy,
    req,
    // update: "x",
  });
  if (!fileRes.status.success) {
    return { status: fileRes.status };
  }
  // console.log(fileRes.results[0].result.fields);
  // console.log(xQuery.fields.concat([fileTerm.split("=")[0]]));
  // console.log(query);
};

export const files = async ({
  x,
  checkedFiles = "",
  result,
  taxonomy,
  apiParams,
  fields,
  req,
}) => {
  let { typesMap, lookupTypes } = await attrTypes({ result, taxonomy });
  let meta = lookupTypes("files");
  let searchFields = await parseFields({
    result,
    fields: `${fields},assembly_span,assembly_span,files,files:metadata`,
    taxonomy,
  });

  let {
    params,
    fields: xFields,
    summaries,
  } = await queryParams({
    term: x,
    result,
    taxonomy,
  });

  let exclusions;
  exclusions = setExclusions(params);
  exclusions.missing = [...new Set([...exclusions.missing, "files"])];

  let xQuery = {
    ...params,
    // query: x,
    fields: [...new Set([...searchFields, ...xFields])],
    exclusions,
  };

  let matrix = await getFileMatrix({
    result,
    taxonomy,
    xQuery,
    apiParams,
    req,
    meta,
  });

  if (checkedFiles.length > 0 && matrix.status.success) {
    let checked = checkedFiles.split(",");
    for (let entry of checked) {
      let [tool = "", run = "", file = "", extra] = entry.split(".");
      if (matrix.matrix[tool]) {
        matrix.matrix[tool].checked = true;
      } else {
        continue;
      }
      if (matrix.matrix[tool].runs[run]) {
        matrix.matrix[tool].runs[run].checked = true;
      } else {
        continue;
      }
      if (matrix.matrix[tool].files[file]) {
        matrix.matrix[tool].files[file].checked = true;
        matrix.matrix[tool].runs[run].files =
          matrix.matrix[tool].runs[run].files || [];
        matrix.matrix[tool].runs[run].files.push(file);
      } else {
        continue;
      }
    }
    // console.log(matrix.matrix.busco.runs);

    let fileTerm;

    for (let tool of Object.keys(matrix.matrix)) {
      if (!matrix.matrix[tool].checked) {
        continue;
      }
      for (let run of Object.keys(matrix.matrix[tool].runs)) {
        if (!matrix.matrix[tool].runs[run].checked) {
          continue;
        }
        fileTerm = `files.${tool}.${run}=${matrix.matrix[tool].runs[
          run
        ].files.join(",")}`;
        break;
      }
      break;
    }
    if (fileTerm) {
      // console.log(fileTerm);
      let fileRes = await getFileLinks({
        result,
        taxonomy,
        xQuery,
        fileTerm,
        apiParams,
        req,
        meta,
        lookupTypes,
        query: matrix.query,
      });
      // console.log(fileRes);
    }
  }

  let status;
  return {
    status: status || { success: true },
    report: {
      status,
      files,
      xQuery: {
        ...xQuery,
      },
    },
    xQuery,
  };
};
