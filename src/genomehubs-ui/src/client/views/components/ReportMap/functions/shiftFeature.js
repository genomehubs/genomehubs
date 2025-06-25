export default function shiftFeature(feature, shift) {
  const newFeature = JSON.parse(JSON.stringify(feature));
  const shiftCoords = (coords) => {
    return coords.map((c) =>
      Array.isArray(c[0]) ? shiftCoords(c) : [c[0] + shift, c[1]],
    );
  };
  if (feature.geometry.type === "Polygon") {
    newFeature.geometry.coordinates = shiftCoords(feature.geometry.coordinates);
  } else if (feature.geometry.type === "MultiPolygon") {
    newFeature.geometry.coordinates =
      feature.geometry.coordinates.map(shiftCoords);
  }
  return newFeature;
}
