export const precision = (val) => {
  if (!isFinite(val)) return 0;
  let exp = 1,
    prec = 0;
  while (Math.round(val * exp) / exp !== val) {
    exp *= 10;
    prec++;
  }
  return prec;
};
