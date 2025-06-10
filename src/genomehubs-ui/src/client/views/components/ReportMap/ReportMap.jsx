import "proj4leaflet";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getCrs,
  getFitWorldBounds,
  normalizeBounds,
} from "./functions/mapHelpers";
import { useLocation, useNavigate } from "@reach/router";

import Globe from "./Globe";
import Grid from "@mui/material/Grid2";
import L from "leaflet";
import Map from "./Map";
import MapLegend from "./MapLegend";
import MarkerComponent from "./MarkerComponent";
import { compose } from "recompose";
import countriesGeoJson from "../geojson/countries.geojson";
import dispatchMessage from "../../hocs/dispatchMessage";
import { mixColor } from "../../functions/mixColor";
import proj4 from "proj4";
import qs from "../../functions/qs";
import setColors from "../../functions/setColors";
import useResize from "../../hooks/useResize";
import withColors from "#hocs/withColors";
import withReportTerm from "../../hocs/withReportTerm";
import withSearchIndex from "../../hocs/withSearchIndex";
import withSiteName from "#hocs/withSiteName";
import withTheme from "#hocs/withTheme";

// Default region attribute (user-editable in future)
const REGION_ATTRIBUTE = "country_code";

const PROJECTION_BOUNDS = {
  mercator: {
    minZoom: 0,
    maxZoom: 6,
    worldBounds: [
      [-85.05112878, -180],
      [85.05112878, 180],
    ],
  },
  cylindricalEqualArea: {
    minZoom: 0,
    maxZoom: 5,
    worldBounds: [
      [-90, -180],
      [90, 180],
    ],
  },
  mollweide: {
    minZoom: 0,
    maxZoom: 5,
    worldBounds: [
      [-90, -180],
      [90, 180],
    ],
  },
  albersEqualArea: {
    minZoom: 0,
    maxZoom: 5,
    worldBounds: [
      [-90, -180],
      [90, 180],
    ],
  },
};

const queryLink = ({ query, conditions, options }) => {
  const { query: q, x, ...rest } = query;
  let newConditions = [];
  if (q) {
    newConditions = q.split(" AND ").filter((c) => c.trim() !== "");
  } else if (x) {
    newConditions = x.split(" AND ").filter((c) => c.trim() !== "");
  }
  newConditions = newConditions.concat(conditions);
  if (newConditions.length > 0) {
    newConditions = newConditions.filter((c) => c.trim() !== "");
    newConditions = newConditions.map((c) => c.trim());
    newConditions = newConditions.join(" AND ");
  } else {
    newConditions = "null";
  }
  const newQuery = { ...rest, [x ? "x" : "query"]: newConditions, ...options };
  return `?${qs.stringify(newQuery)}`;
};

const ReportMap = ({
  map,
  chartRef,
  containerRef,
  searchIndexPlural,
  embedded,
  ratio,
  stacked,
  message,
  setMessage,
  colors,
  levels,
  colorPalette,
  palettes,
  colorScheme,
  theme,
  minDim,
  setMinDim,
  xOpts,
  basename,
  locationField,
  regionField,
  geoBinResolution,
  geoBounds,
  mapProjection = "cylindricalEqualArea",
  mapTheme,
  mapType,
  // mapProjection = "mercator",
  reportSelect,
  ...props
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = qs.parse(location.search.replace(/^\?/, ""));
  if (query.mapProjection) {
    mapProjection = query.mapProjection;
  }
  if (query.mapType) {
    mapType = query.mapType;
  }
  if (query.mapTheme) {
    mapTheme = query.mapTheme;
  }
  if (!geoBinResolution && query.geoBinResolution) {
    geoBinResolution = parseInt(query.geoBinResolution, 10) || 0;
  }
  if (!locationField && query.locationField) {
    locationField = query.locationField;
  }
  if (!regionField && query.regionField) {
    regionField = query.regionField;
  }
  if (!geoBounds && query.geoBounds) {
    geoBounds = query.geoBounds;
  }
  const regionLink = (code) => {
    const conditions = [`${regionField}=${code}`];
    const options = {};
    return queryLink({ query, conditions, options });
  };
  const hexbinLink = (hexbin) => {
    const locationBinField = `hexbin${geoBinResolution}(${locationField})`;

    const conditions = [`${locationBinField}=${hexbin}`];
    const newResolution = geoBinResolution < 4 ? geoBinResolution + 1 : 4;
    const options = { geoBinResolution: newResolution };
    return queryLink({ query, conditions, options });
  };
  const pointLink = (lat, lon) => {
    const conditions = [`${locationField}=${lat},${lon}`];
    const options = {};
    return queryLink({ query, conditions, options });
  };
  const componentRef = chartRef || useRef();
  const size = useResize(containerRef || componentRef);
  let { width, height } = size;
  const measured = size.width && size.height;
  width = width || 400;
  height = height || 300;
  const [globeView, setGlobeView] = useState(mapType === "globe");
  const [nightMode, setNightMode] = useState(
    mapTheme ? mapTheme === "night" : theme === "darkTheme",
  );
  const [crs, setCrs] = useState(() => getCrs(mapProjection, L));
  const [mapInstanceKey, setMapInstanceKey] = useState(0);
  // const mapRef = useRef(null);

  // CRS setup (now synchronous)
  useEffect(() => {
    setCrs(getCrs(mapProjection, L));
    setMapInstanceKey((prev) => prev + 1);
  }, [mapProjection]);

  const countryOverlayColor = "#ff7001";
  const hexbinOverlayColor = "#70ff01";
  const regionCounts = map?.report?.map?.regionCounts;
  const hexBinCounts = map?.report?.map?.hexBinCounts;
  const [minCountryCount, maxCountryCount] = useMemo(() => {
    if (regionCounts && Object.values(regionCounts).length > 0) {
      const vals = Object.values(regionCounts).filter(
        (v) => typeof v === "number",
      );
      if (vals.length) {
        return [Math.min(...vals, 0), Math.max(...vals, 1)];
      }
    }
    return [0, 1];
  }, [regionCounts]);
  const [minHexbinCount, maxHexbinCount] = useMemo(() => {
    if (hexBinCounts && Object.values(hexBinCounts).length > 0) {
      const vals = Object.values(hexBinCounts).filter(
        (v) => typeof v === "number",
      );
      if (vals.length) {
        return [Math.min(...vals, 0), Math.max(...vals, 1)];
      }
    }
    return [0, 1];
  }, [hexBinCounts]);

  useEffect(() => {
    if (message && map && map.status) {
      setMessage(null);
    }
  }, [map]);
  let options = qs.parse(location.search.replace(/^\?/, ""));
  if (map && map.status) {
    const { locationBounds, bounds } = map.report;
    let pointData = map.report.map.rawData || {};
    if (geoBounds) {
      let [w, s, e, n] = geoBounds.split(",").map(parseFloat);
      if (isNaN(w) || isNaN(s) || isNaN(e) || isNaN(n)) {
        console.warn("Invalid geoBounds format:", geoBounds);
        geoBounds = null;
      } else {
        geoBounds = [
          [n + 1, w - 1],
          [s - 1, e + 1],
        ];
      }
    }
    if (!geoBounds) {
      if (locationBounds?.stats?.geo?.bounds) {
        geoBounds = locationBounds.stats.geo.bounds;

        geoBounds = [
          [geoBounds.top_left.lat + 1, geoBounds.top_left.lon - 1],
          [geoBounds.bottom_right.lat - 1, geoBounds.bottom_right.lon + 1],
        ];
      } else {
        // Calculate default geoBounds based on container aspect ratio
        const aspect = width && height ? (width / height) * 2 : 2;
        let latSpan = 90;
        let lonSpan = latSpan * aspect;
        if (lonSpan > 360) {
          lonSpan = 360;
          latSpan = lonSpan / aspect;
        }
        // Pick a random longitude between -120 and 120
        const centerLon = Math.random() * 240 - 120;

        // Center longitude on centerLon
        geoBounds = [
          [latSpan / 2, centerLon - lonSpan / 2],
          [-latSpan / 2, centerLon + lonSpan / 2],
        ];
      }
    }
    // Use regionCounts from API if available
    let { regionCounts, hexBinCounts } = map.report.map || {};
    let markers = [];
    let pointsData = [];
    // Calculate country counts from regionCounts
    let countryCounts;
    if (!regionCounts || Object.keys(regionCounts).length === 0) {
      countryCounts = {};
      countriesGeoJson.features.forEach((feature) => {
        const code = feature.properties.ISO_A2;
        countryCounts[code] = 0;
      });
    } else {
      countryCounts = { ...regionCounts };
    }

    if (bounds?.cats) {
      ({ levels, colors } = setColors({
        colorPalette,
        palettes,
        levels,
        count: bounds.cats.length,
        colors,
      }));
      bounds.cats.forEach((obj, i) => {
        if (1 || globeView) {
          const points = MarkerComponent({
            geoPoints: pointData ? pointData[obj.key] : [],
            color: colors[i],
            options,
            basename,
            globeView: true,
            selectable: reportSelect === "point",
          });
          pointsData.push(...points);
        } else {
          markers.push(
            <MarkerComponent
              key={i}
              geoPoints={pointData ? pointData[obj.key] : []}
              color={colors[i]}
              options={options}
              basename={basename}
              globeView={false}
              selectable={reportSelect === "point"}
            />,
          );
        }
      });
      if (bounds.showOther) {
        const i = bounds.cats.length;
        if (1 || globeView) {
          const points = MarkerComponent({
            geoPoints: pointData["other"],
            color: colors[i],
            options,
            globeView: true,
            selectable: reportSelect === "point",
          });
          pointsData.push(...points);
        } else {
          markers.push(
            <MarkerComponent
              key={i}
              geoPoints={pointData["other"]}
              color={colors[i]}
              options={options}
              globeView={false}
              selectable={reportSelect === "point"}
            />,
          );
        }
      }
    } else if (Object.keys(pointData).length > 0 && (1 || globeView)) {
      // Fallback to first key if expected key is missing
      let key = `all ${searchIndexPlural}`;
      if (!pointData[key]) {
        key = Object.keys(pointData)[0];
      }
      const points = MarkerComponent({
        geoPoints: pointData[key],
        color: colors[0],
        options,
        globeView: true,
        selectable: reportSelect === "point",
      });
      pointsData.push(...points);
    } else if (Object.keys(pointData).length > 0) {
      let key = `all ${searchIndexPlural}`;
      if (!pointData[key]) {
        key = Object.keys(pointData)[0];
      }
      markers.push(
        <MarkerComponent
          key={0}
          geoPoints={pointData[key]}
          color={colors[0]}
          options={options}
          globeView={false}
          selectable={reportSelect === "point"}
        />,
      );
    }
    const handleCountryClick = (code) => {
      // Filter search by country_code
      options[REGION_ATTRIBUTE] = code;
      navigate(`/search?${qs.stringify(options)}`);
    };
    // Move useMemo for projection bounds up here, before any return
    const projectionBounds = useMemo(() => {
      return (
        PROJECTION_BOUNDS[mapProjection] ||
        PROJECTION_BOUNDS.cylindricalEqualArea
      );
    }, [mapProjection]);
    const fitWorldBounds = useMemo(
      () =>
        getFitWorldBounds(
          mapProjection,
          width,
          height,
          [0, 0],
          crs,
          PROJECTION_BOUNDS,
          L,
        ),
      [mapProjection, width, height, crs],
    );
    let dataBounds = fitWorldBounds;
    if (geoBounds) {
      // Use provided geoBounds if available
      dataBounds = normalizeBounds(geoBounds);
    } else if (locationBounds?.stats?.geo?.bounds && !geoBounds) {
      dataBounds = normalizeBounds(locationBounds?.stats?.geo?.bounds);
    }
    let mapGlobe = null;
    if (globeView) {
      // Use Globe component for globe view
      mapGlobe = (
        <Globe
          key={`globe-${mapProjection}-${crs?.code || crs?.options?.code || ""}`}
          // ref={mapRef}
          width={width}
          height={height}
          dataBounds={dataBounds}
          theme={theme}
          colorScheme={colorScheme}
          nightMode={nightMode}
          projectionBounds={projectionBounds}
          fitWorldBounds={fitWorldBounds}
          regionField={regionField}
          countryCounts={countryCounts}
          onCountryClick={handleCountryClick}
          countryOverlayColor={countryOverlayColor}
          pointsData={pointsData}
          hexPolygonResolution={geoBinResolution}
          hexBinCounts={hexBinCounts}
          hexbinOverlayColor={hexbinOverlayColor}
          maxBinCount={maxHexbinCount}
          regionLink={regionLink}
          hexbinLink={hexbinLink}
          pointLink={pointLink}
          reportSelect={reportSelect}
          {...props}
        />
      );
    } else if (measured && crs) {
      // Use Map component for flat map view
      mapGlobe = (
        <Map
          key={`map-${mapProjection}-${crs?.code || crs?.options?.code || ""}`}
          // ref={mapRef}
          width={width}
          height={height}
          theme={theme}
          colorScheme={colorScheme}
          nightMode={nightMode}
          mapProjection={mapProjection}
          regionField={regionField}
          crs={crs}
          dataBounds={dataBounds}
          projectionBounds={projectionBounds}
          fitWorldBounds={fitWorldBounds}
          countryOverlayColor={countryOverlayColor}
          countryCounts={countryCounts}
          onCountryClick={handleCountryClick}
          countryOutlineGlow={nightMode}
          hexBinCounts={hexBinCounts}
          hexbinOverlayColor={hexbinOverlayColor}
          maxBinCount={maxHexbinCount}
          // markers={markers}
          pointsData={pointsData}
          regionLink={regionLink}
          hexbinLink={hexbinLink}
          pointLink={pointLink}
          reportSelect={reportSelect}
          {...props}
        />
      );
    }
    // Only render Map when measured width and height are available and crs is set
    if (measured && crs) {
      return (
        <Grid
          ref={componentRef}
          style={{ height: "100%", position: "relative" }}
          size="grow"
        >
          <div
            style={{
              position: "relative",
              width,
              height,
            }}
          >
            <MapLegend
              {...{
                nightMode,
                theme,
                colorScheme,
                globeView,
                setGlobeView,
                setNightMode,
                minCountryCount,
                maxCountryCount,
                countryOverlayColor,
                minHexbinCount,
                maxHexbinCount,
                hexbinOverlayColor,
                locationField,
                regionField,
                catField: bounds?.cat,
                cats: bounds?.cats || [],
                showPoints: Boolean(Object.keys(pointData).length > 0),
                colors,
              }}
            />
            {mapGlobe}
          </div>
        </Grid>
      );
    }
  } else {
    if (message) {
      setMessage(message);
    } else {
      setMessage("No map data available");
    }
    return null;
  }
};

export default compose(
  withSiteName,
  dispatchMessage,
  withColors,
  withTheme,
  withSearchIndex,
  withReportTerm,
)(ReportMap);
