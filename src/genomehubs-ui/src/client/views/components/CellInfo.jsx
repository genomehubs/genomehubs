export const CellInfo = ({ x, y, count, rows }) => {
  return (
    <div>
      <div>x: {x}</div>
      {y && <div>y: {y}</div>}
      <div>count: {count}</div>
      {rows}
    </div>
  );
};

export default CellInfo;
