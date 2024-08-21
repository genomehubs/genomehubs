import { Parser } from "json2csv";

export const formatCsv = async (response, opts) => {
  let fields = ["taxon_id", "taxon_rank", "scientific_name"];
  if (opts.result == "assembly") {
    fields.push("assembly_id");
  }
  if (opts.result == "sample") {
    fields.push("sample_id");
  }
  let names = [];
  if (opts.names) {
    opts.names.forEach((nameClass) => {
      names.push(nameClass);
    });
  }
  let ranks = [];
  if (opts.ranks) {
    opts.ranks.forEach((rank) => {
      ranks.push(rank);
    });
  }
  let meta = ["aggregation_source", "aggregation_method"];
  let source = ["name", "date"];
  let usedFields = {};
  let allFields = {};
  let data = [];
  if (!response.results) {
    return "NO RESULTS";
  }
  response.results.forEach((fullResult) => {
    let datum = {};
    fields.forEach((key) => {
      datum[key] = fullResult.result[key];
    });
    if (opts.names) {
      opts.names.forEach((nameClass) => {
        datum[nameClass] =
          fullResult.result.names[nameClass] &&
          fullResult.result.names[nameClass].name;
      });
    }
    if (opts.ranks) {
      opts.ranks.forEach((rank) => {
        datum[rank] =
          fullResult.result.ranks[rank] &&
          fullResult.result.ranks[rank].scientific_name;
      });
    }
    if (opts.fields) {
      opts.fields.forEach((key) => {
        allFields[key] = true;
        if (
          fullResult.result.fields &&
          fullResult.result.fields.hasOwnProperty(key)
        ) {
          // TODO: add option for sparse table
          usedFields[key] = true;
          let { value, binned = value } = fullResult.result.fields[key];
          value = binned;
          if (opts.tidyData) {
            if (opts.includeRawValues) {
              if (fullResult.result.fields[key].hasOwnProperty("rawValues")) {
                fullResult.result.fields[key]["rawValues"].forEach(
                  (rawValue) => {
                    let sourceMeta =
                      rawValue.metadata && rawValue.metadata.source;
                    if (!sourceMeta) {
                      return;
                    }
                    let row = { ...datum };
                    row.field = key;
                    row.value = rawValue.value;
                    source.forEach((sourceKey) => {
                      if (sourceMeta.hasOwnProperty(sourceKey)) {
                        row[sourceKey] = sourceMeta[sourceKey];
                      }
                    });
                    data.push(row);
                  }
                );
              }
            } else {
              if (!Array.isArray(value)) {
                value = [value];
              }
              value.forEach((val) => {
                let row = { ...datum };
                row.field = key;
                row.value = val;
                meta.forEach((metaKey) => {
                  if (fullResult.result.fields[key].hasOwnProperty(metaKey)) {
                    row[metaKey] = fullResult.result.fields[key][metaKey];
                  }
                });
                data.push(row);
              });
            }
          } else {
            if (Array.isArray(value)) {
              value = value.join(";");
            }
            datum[key] = value;
          }
        }
      });
    }
    if (!opts.tidyData) {
      data.push(datum);
    }
  });
  if (opts.tidyData) {
    if (Object.keys(usedFields).length > 0) {
      if (opts.includeRawValues) {
        opts.fields = fields
          .concat(names)
          .concat(ranks)
          .concat(["field", "value"])
          .concat(source.map((s) => s.replace(/.+?\./, "")));
      } else {
        opts.fields = fields
          .concat(names)
          .concat(ranks)
          .concat(["field", "value"])
          .concat(meta);
      }
    }
  } else {
    opts.fields = fields
      .concat(names)
      .concat(ranks)
      .concat(Object.keys(allFields));
  }

  try {
    const parser = new Parser(opts);
    return parser.parse(data);
  } catch (err) {
    console.error(err);
  }

  return csv;
};
