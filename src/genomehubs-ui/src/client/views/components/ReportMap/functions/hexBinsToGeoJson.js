import { cellToBoundary } from "h3-js";

export default function hexBinsToGeoJson(hexBinCounts, duplicate = false) {
  return {
    type: "FeatureCollection",
    features: Object.entries(hexBinCounts)
      .flatMap(([h3, count]) => {
        const coords = cellToBoundary(h3, true);
        if (
          coords.length > 0 &&
          (coords[0][0] !== coords[coords.length - 1][0] ||
            coords[0][1] !== coords[coords.length - 1][1])
        ) {
          coords.push([...coords[0]]);
        }
        const feature = {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [coords],
          },
          properties: { h3, count },
        };
        if (duplicate) {
          return [
            feature,
            {
              ...feature,
              properties: { ...feature.properties, duplicate: true },
            },
          ];
        }
        return feature;
      })
      .slice(),
  };
}
