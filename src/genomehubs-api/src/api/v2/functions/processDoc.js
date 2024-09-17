export const processDoc = ({ doc, opts, inner_hits = {} }) => {
  let attributes = {};
  let rawAttrs = doc.attributes || inner_hits.attributes;
  if (rawAttrs) {
    for (let attr of rawAttrs) {
      if (opts && opts.fields && !opts.fields.includes(attr.key)) {
        continue;
      }
      let name;
      let attribute = {};
      for (let key in attr) {
        if (key == "key") {
          name = attr[key];
        } else if (key.match(/_value$/)) {
          if (key == "is_primary_value") {
            attribute.is_primary = true;
          } else {
            attribute.value = attr[key];
          }
        } else if (key == "values") {
          attribute.values = [];
          for (let val of attr[key]) {
            let value = {};
            for (let vkey in val) {
              if (vkey.match(/_value$/)) {
                if (vkey == "is_primary_value") {
                  value.is_primary = Boolean(val[vkey]);
                } else {
                  value.value = val[vkey];
                }
              } else {
                value[vkey] = val[vkey];
              }
            }
            attribute.values.push(value);
          }
        } else if (key == "aggregation_source") {
          if (Array.isArray(attr[key]) && attr[key].includes("direct")) {
            attribute[key] = "direct";
            if (attr[key].includes("descendant")) {
              attribute.has_descendants = true;
            }
          } else {
            attribute[key] = attr[key];
          }
        } else {
          attribute[key] = attr[key];
        }
      }
      attributes[name] = attribute;
    }
  }
  doc.attributes = attributes;
  if (doc.lineage && doc.lineage.length > 0 && doc.lineage[0].node_depth == 0) {
    doc.lineage = doc.lineage.slice(1);
  }
  return doc;
};
