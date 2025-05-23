import { cellToBoundary } from "h3-js";

export default function hexBinsToGeoJson(hexBinCounts) {
  return {
    type: "FeatureCollection",
    features: Object.entries(hexBinCounts)
      .map(([h3, count]) => {
        const coords = cellToBoundary(h3, true);
        if (
          coords.length > 0 &&
          (coords[0][0] !== coords[coords.length - 1][0] ||
            coords[0][1] !== coords[coords.length - 1][1])
        ) {
          coords.push([...coords[0]]);
        }
        return {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [coords],
          },
          properties: { h3, count },
        };
      })
      .slice(),
  };
}
