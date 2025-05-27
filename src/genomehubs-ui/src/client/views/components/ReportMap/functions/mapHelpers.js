import "proj4leaflet";

import proj4 from "proj4";

// Helper: Clamp bounds to valid world extent
export const clampLatLng = (lat, lng) => [
  Math.max(-90, Math.min(90, lat)),
  Math.max(-180, Math.min(180, lng)),
];

// Helper: Normalize and clamp bounds to [southWest, northEast] within world
export const normalizeBounds = (b, projection, PROJECTION_BOUNDS) => {
  let sw, ne;
  if (b && !Array.isArray(b) && typeof b === "object") {
    // If bounds is an object, convert to array format
    // example: {top_left: {lat: 77.78527798131108, lon: -70.63138900324702}, bottom_right: {lat: 41.1921838670969, lon: 1.206449819728732}}
    [sw, ne] = [
      clampLatLng(b.bottom_right.lat, b.top_left.lon),
      clampLatLng(b.top_left.lat, b.bottom_right.lon),
    ];
  } else if (!b || b.length !== 2) {
    // Use world bounds for the current projection
    return (
      PROJECTION_BOUNDS[projection]?.worldBounds || [
        [-90, -180],
        [90, 180],
      ]
    );
  } else {
    [sw, ne] = [clampLatLng(...b[0]), clampLatLng(...b[1])];
  }
  const minLat = Math.min(sw[0], ne[0]);
  const maxLat = Math.max(sw[0], ne[0]);
  const minLng = Math.min(sw[1], ne[1]);
  const maxLng = Math.max(sw[1], ne[1]);
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
};

// Helper: Calculate world aspect ratio for each projection
export const getWorldAspect = (projection, PROJECTION_BOUNDS) => {
  const wb = PROJECTION_BOUNDS[projection]?.worldBounds;
  if (!wb) {
    return 2;
  } // default aspect ratio
  const latSpan = Math.abs(wb[1][0] - wb[0][0]);
  const lngSpan = Math.abs(wb[1][1] - wb[0][1]);
  return lngSpan / latSpan;
};

// Helper: Compute bounds to fit world, cropping E/W or N/S as needed using projected coordinates
export const getFitWorldBounds = (
  projection,
  width,
  height,
  center = [0, 0],
  crsObj,
  PROJECTION_BOUNDS,
  L,
) => {
  const wb = PROJECTION_BOUNDS[projection]?.worldBounds;
  if (!wb) {
    return [
      [-90, -180],
      [90, 180],
    ];
  }
  if (!width || !height) {
    return [wb[0], wb[1]];
  }
  // Use Leaflet CRS for projection math
  const crsToUse = crsObj && crsObj.project ? crsObj : L.CRS.EPSG3857;
  // Project world bounds corners
  const sw = crsToUse.project(L.latLng(wb[0][0], wb[0][1]));
  const ne = crsToUse.project(L.latLng(wb[1][0], wb[1][1]));
  const minX = Math.min(sw.x, ne.x);
  const maxX = Math.max(sw.x, ne.x);
  const minY = Math.min(sw.y, ne.y);
  const maxY = Math.max(sw.y, ne.y);
  const worldWidth = maxX - minX;
  const worldHeight = maxY - minY;
  const mapAspect = width / height;
  const worldAspect = worldWidth / worldHeight;
  // Project center
  const centerProjected = crsToUse.project(L.latLng(center[0], center[1]));
  let cropMinX, cropMaxX, cropMinY, cropMaxY;
  if (mapAspect > worldAspect) {
    // Map is wider: crop horizontally (X), always show full vertical extent (Y)
    const cropWidth = worldHeight * mapAspect;
    cropMinX = centerProjected.x - cropWidth / 2;
    cropMaxX = centerProjected.x + cropWidth / 2;
    // Clamp to world bounds
    if (cropMinX < minX) {
      cropMinX = minX;
      cropMaxX = cropMinX + cropWidth;
    }
    if (cropMaxX > maxX) {
      cropMaxX = maxX;
      cropMinX = cropMaxX - cropWidth;
    }
    cropMinY = minY;
    cropMaxY = maxY;
  } else {
    // Map is taller: crop vertically (Y)
    const cropHeight = worldWidth / mapAspect;
    cropMinY = centerProjected.y - cropHeight / 2;
    cropMaxY = centerProjected.y + cropHeight / 2;
    // Clamp to world bounds
    if (cropMinY < minY) {
      cropMinY = minY;
      cropMaxY = cropMinY + cropHeight;
    }
    if (cropMaxY > maxY) {
      cropMaxY = maxY;
      cropMinY = cropMaxY - cropHeight;
    }
    cropMinX = minX;
    cropMaxX = maxX;
  }
  // Unproject cropped bounds back to lat/lng
  let swLatLng, neLatLng;
  try {
    swLatLng = crsToUse.unproject(L.point(cropMinX, cropMinY));
  } catch (e) {
    swLatLng = { lat: wb[0][0], lng: wb[0][1] };
  }
  try {
    neLatLng = crsToUse.unproject(L.point(cropMaxX, cropMaxY));
  } catch (e) {
    neLatLng = { lat: wb[1][0], lng: wb[1][1] };
  }
  // Clamp to valid lat/lng with extra floating point tolerance and NaN protection
  function clampLatLngWithTolerance(lat, lng) {
    const EPS = 1e-6;
    const safeLat = isNaN(lat) ? 0 : lat;
    const safeLng = isNaN(lng) ? 0 : lng;
    const clampedLat = Math.max(
      -90,
      Math.min(
        90,
        Math.abs(safeLat) < 90 + EPS ? safeLat : safeLat < 0 ? -90 : 90,
      ),
    );
    const clampedLng = Math.max(
      -180,
      Math.min(
        180,
        Math.abs(safeLng) < 180 + EPS ? safeLng : safeLng < 0 ? -180 : 180,
      ),
    );
    return [clampedLat, clampedLng];
  }
  const swClamped = clampLatLngWithTolerance(swLatLng.lat, swLatLng.lng);
  const neClamped = clampLatLngWithTolerance(neLatLng.lat, neLatLng.lng);
  return [swClamped, neClamped];
};

// Helper: Calculate dynamic minZoom for Mercator so the world fills the map area (width or height)
export function getMercatorMinZoom(widthPx, heightPx) {
  // World width and height in meters for EPSG:3857
  const worldWidth = 40075016.68557849;
  // Mercator projection latitude limits: ~85.05112878°
  // Calculate world height in meters between -85.05112878 and +85.05112878 latitude
  const maxLat = 85.05112878;
  const R = 6378137; // Earth's radius in meters (WGS84)
  const latRad = (lat) => (lat * Math.PI) / 180;
  const y = (lat) => R * Math.log(Math.tan(Math.PI / 4 + latRad(lat) / 2));
  const worldHeight = Math.abs(y(maxLat) - y(-maxLat));
  // Initial resolution (meters/pixel at zoom 0)
  const initialRes = 156543.03392804097;
  if ((!widthPx || widthPx <= 0) && (!heightPx || heightPx <= 0)) {
    return 0;
  }
  // Calculate zoom for width and height
  const zoomW = Math.log2((widthPx * initialRes) / worldWidth);
  const zoomH = Math.log2((heightPx * initialRes) / worldHeight);
  // Use the larger zoom (most zoomed in) so the map always fills the area
  return Math.max(0, Math.max(zoomW, zoomH));
}

// Generalized: Calculate dynamic zoom for any projection so the world fills the map area (width or height)
export function getFitWorldZoom(widthPx, heightPx, crs, worldBounds, L) {
  if (!widthPx || !heightPx || !crs || !worldBounds) {
    return 0;
  }
  // Project world bounds to CRS
  const sw = crs.project(L.latLng(worldBounds[0][0], worldBounds[0][1]));
  const ne = crs.project(L.latLng(worldBounds[1][0], worldBounds[1][1]));
  const worldWidth = Math.abs(ne.x - sw.x);
  const worldHeight = Math.abs(ne.y - sw.y);
  // Use CRS's initial resolution if available, else fallback to Mercator
  const initialRes = crs.options?.resolutions?.[0] || 156543.03392804097;
  // Calculate zoom for width and height
  const zoomW = Math.log2((widthPx * initialRes) / worldWidth);
  const zoomH = Math.log2((heightPx * initialRes) / worldHeight);
  return Math.max(0, Math.max(zoomW, zoomH));
}

export function getCrs(projection, L) {
  if (projection === "mercator") {
    return L.CRS.EPSG3857;
  }
  if (projection === "cylindricalEqualArea") {
    return new L.Proj.CRS(
      "EPSG:6933",
      "+proj=cea +lon_0=0 +lat_ts=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
      {
        origin: [-20037508.342789244, 20037508.342789244],
        resolutions: [
          156543.03392804097, 78271.51696402048, 39135.75848201024,
          19567.87924100512, 9783.93962050256, 4891.96981025128,
          2445.98490512564, 1222.99245256282, 611.49622628141, 305.748113140705,
          152.8740565703525, 76.43702828517625, 38.21851414258813,
          19.109257071294063, 9.554628535647032, 4.777314267823516,
          2.388657133911758, 1.194328566955879,
        ],
        bounds: L.bounds(
          [-20037508.342789244, -20037508.342789244],
          [20037508.342789244, 20037508.342789244],
        ),
      },
    );
  }
  // fallback
  return L.CRS.EPSG3857;
}
