export const parseCatOpts = ({ cat, query, lookupTypes }) => {
  // Robustly split cat and opts and accept '+' either inside the
  // bracket (e.g. field[5+]) or immediately after it (field[5]+)
  // Examples (same semantics as before):
  //  - "field" => catOpts = ";;"
  //  - "field=value" => catOpts = "value;;"
  //  - "field[12]" => catOpts = ";;12"
  //  - "field[5+]" or "field[5]+" => catOpts = ";;5+"
  //  - "field[5+]=a,b" or "field[5]+=a,b" => catOpts = "a,b;;5+"

  const input = cat || "";
  // Capture: field, count, plus inside bracket, plus after bracket, values
  const m = input.match(
    /^\s*([^\[\]=+]+)(?:\s*\[([0-9]+)(\+?)\])?(\+)?\s*(?:=(.*))?$/,
  );
  let field;
  let count;
  let values;
  if (m) {
    field = (m[1] || "").trim();
    count = m[2];
    const plusInside = !!m[3];
    const plusAfter = !!m[4];
    values = m[5];
    if ((plusInside || plusAfter) && count) {
      if (!String(count).endsWith("+")) {
        count = `${count}+`;
      }
    }
  } else {
    // Fallback to previous splitting behaviour for any odd formats
    let [f, c, v] = input.split(/\s*=*\s*\[([\d\+]+)\]\s*=*\s*/);
    if (!c) {
      [f, v] = input.split(/\s*=\s*/);
    }
    field = f;
    count = c;
    values = v;
    // If '+' ended up in values (e.g. "field[2]+"), move it to count
    if (values && values.match(/\+/)) {
      values = values.replace(/\+/g, "");
      count = `${count || ""}+`;
    }
  }

  let catMeta = lookupTypes(field);
  let catOpts = `${typeof values === "undefined" || values === null ? "" : values};;${
    typeof count === "undefined" || count === null ? "" : count
  }`;
  return { cat: field, catMeta, query, catOpts };
};

export default parseCatOpts;
