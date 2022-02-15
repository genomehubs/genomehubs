export const incrementDate = (val) => {
  let date = new Date(val);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  return date.getTime();
};
