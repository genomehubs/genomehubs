export const CountrySVG = ({ coordinates, fill, stroke }) => {
  // Render SVG polygons for all coordinate sets (handles MultiPolygon)
  // Wrap polygons in an SVG element for display

  // Calculate bounding box of all coordinates (input is [lng, lat])
  let minLng = 180,
    maxLng = -180,
    minLat = 90,
    maxLat = -90;

  // Flatten coordinates to handle MultiPolygon (array of arrays of arrays)
  const flattenCoords = (coords) => {
    if (
      Array.isArray(coords) &&
      coords.length > 0 &&
      Array.isArray(coords[0][0])
    ) {
      // MultiPolygon or Polygon with holes
      return coords.flatMap(flattenCoords);
    }
    return [coords];
  };

  const allRings = flattenCoords(coordinates);

  // Calculate bounding box and collect all lat/lngs
  let lats = [];
  let lngs = [];
  allRings.forEach((ring) => {
    ring.forEach(([lng, lat]) => {
      lats.push(lat);
      lngs.push(lng);
    });
  });

  // Calculate middle latitude and longitude
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;

  // Handle dateline crossing for longitude
  // Shift longitudes so that the polygon is not split at the dateline
  const shiftLngs = (() => {
    // Count how many points are in the eastern and western hemispheres
    const east = lngs.filter((lng) => lng >= 90).length;
    const west = lngs.filter((lng) => lng <= 90).length;
    // If the polygon crosses the dateline, shift the minority hemisphere by ±360
    if (east > 0 && west > 0) {
      // Determine which hemisphere has fewer points
      if (east > west) {
        // Shift western hemisphere points (+360)
        return (lng) => (lng < 0 ? lng + 360 : lng);
      } else {
        // Shift eastern hemisphere points (-360)
        return (lng) => (lng >= 0 ? lng - 360 : lng);
      }
    }
    return (lng) => lng;
  })();

  // Apply shift to all lngs for bbox and projection
  const shiftedLngs = lngs.map(shiftLngs);
  const midLng = (Math.min(...shiftedLngs) + Math.max(...shiftedLngs)) / 2;

  // Calculate scale factor based on middle latitude
  const absMidLat = Math.abs(midLat);
  const scale =
    absMidLat <= 60
      ? 0.75 + (absMidLat / 60) * 0.75 // 0.75 at 0°, 1.5 at 60°
      : 1.5; // clamp at 1.5 for >60°

  // Now compute scaled bounding box
  minLng = Infinity;
  maxLng = -Infinity;
  minLat = Infinity;
  maxLat = -Infinity;

  allRings.forEach((ring) => {
    ring.forEach(([lng, lat]) => {
      const shiftedLng = shiftLngs(lng);
      // Scale longitude relative to middle longitude
      const scaledLng = midLng + (shiftedLng - midLng) / scale;
      if (scaledLng < minLng) {
        minLng = scaledLng;
      }
      if (scaledLng > maxLng) {
        maxLng = scaledLng;
      }
      if (lat < minLat) {
        minLat = lat;
      }
      if (lat > maxLat) {
        maxLat = lat;
      }
    });
  });

  // Add a small margin
  const marginLng = (maxLng - minLng) * 0.05;
  const marginLat = (maxLat - minLat) * 0.05;

  // Scale longitude for viewport (to match projection)
  // Use the same scale as for the projected coordinates
  const viewBoxMinLng = minLng - marginLng;
  const viewBoxMinLat = minLat - marginLat;
  const viewBoxWidth = maxLng + 2 * marginLng - minLng;
  const viewBoxHeight = maxLat - minLat + 2 * marginLat;

  // Project lat/lon to SVG coordinates
  // SVG y increases down, lat increases up, so y = maxLat+marginLat - lat
  const project = ([lng, lat]) => {
    const shiftedLng = shiftLngs(lng);
    // Use the precomputed 'scale' from above for all points
    return [midLng + (shiftedLng - midLng) / scale, maxLat + marginLat - lat];
  };

  return (
    <svg
      viewBox={`${viewBoxMinLng} 0 ${viewBoxWidth} ${viewBoxHeight}`}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      preserveAspectRatio="xMidYMid meet"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        width: "100%",
        height: "100%",
      }}
    >
      {allRings.map((ring, i) => {
        const points = ring
          .filter((coord) => Array.isArray(coord) && coord.length >= 2)
          .map(project)
          .map((coord) => {
            if (Array.isArray(coord) && coord.length >= 2) {
              const [x, y] = coord;
              return `${x},${y}`;
            }
            return "";
          })
          .filter(Boolean)
          .join(" ");
        return (
          <polygon
            key={i}
            points={points}
            style={{
              fill,
              stroke,
              vectorEffect: "non-scaling-stroke",
              strokeWidth: 0.5,
              fillOpacity: 0.8,
            }}
          />
        );
      })}
    </svg>
  );
};

export default CountrySVG;
