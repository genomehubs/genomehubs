export const compareValues = (valueA, valueB, comp) => {
  let inverse, cmp;
  if (comp.startsWith("!")) {
    inverse = true;
    cmp = str.substring(1);
  } else {
    cmp = comp;
  }
  if (cmp.match(/^=+$/)) {
    let arrA = (Array.isArray(valueA) ? valueA : [valueA]).flatMap(
      (o) => o.value || o
    );
    let arrB = valueB.split(",");
    let match = false;
    for (let a of arrA) {
      if (arrB.includes(a)) {
        match = true;
        break;
      }
    }
    return inverse ? !match : match;
  }
};

export default compareValues;
