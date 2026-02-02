export const PointInfo = ({
  x,
  y,
  fill,
  featureId,
  yFeatureId,
  group,
  cat,
  chartProps,
  payload,
}) => {
  if (featureId) {
    return (
      <div>
        {cat && (
          <div
            style={{
              height: "1.5em",
              width: "1.5em",
              borderRadius: "0.75em",
              backgroundColor: fill,
            }}
          />
        )}
        <div>
          {chartProps.groupBy}: {group}
        </div>
        <div>x: {featureId}</div>
        {yFeatureId && <div>y: {yFeatureId}</div>}
        {cat && (
          <div>
            {chartProps.bounds.cat}: {cat}
          </div>
        )}
      </div>
    );
  }
  return (
    <div>
      {cat && (
        <div
          style={{
            height: "1.5em",
            width: "1.5em",
            borderRadius: "0.75em",
            backgroundColor: fill,
          }}
        />
      )}
      <div>x: {payload.x}</div>
      {y && <div>y: {payload.y}</div>}
      {cat && (
        <div>
          {chartProps.bounds.cat}: {cat}
        </div>
      )}
    </div>
  );
};

export default PointInfo;
