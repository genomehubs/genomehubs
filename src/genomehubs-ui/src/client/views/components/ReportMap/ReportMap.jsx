import "leaflet/dist/leaflet.css";
import "proj4leaflet";

import {
  CircleMarker,
  GeoJSON,
  LayerGroup,
  MapContainer,
  Pane,
  Popup,
  TileLayer,
} from "react-leaflet";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import MarkerComponent from "./functions/MarkerComponent";
import { compose } from "recompose";
import countriesGeoJson from "../geojson/countries.geojson";
import dispatchMessage from "../../hocs/dispatchMessage";
import getCountryColor from "./functions/getCountryColor";
import { mixColor } from "../../functions/mixColor";
import proj4 from "proj4";
import qs from "../../functions/qs";
import setColors from "../../functions/setColors";
import useResize from "../../hooks/useResize";
import withColors from "#hocs/withColors";
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
};

const CountryLayer = ({
  countryCounts,
  onCountryClick,
  repeat = false,
  baseBg = "#eeeeee",
  outlineColor = "#333",
  outlineGlow = false,
}) => {
  // Find max count for color scaling
  const maxCount = Math.max(...Object.values(countryCounts), 1);

  return (
    <GeoJSON
      data={{ type: "FeatureCollection", features: countriesGeoJson.features }}
      style={(feature) => ({
        fillColor: getCountryColor(
          countryCounts[feature.properties.ISO_A2],
          maxCount,
          undefined,
          baseBg,
        ),
        weight: 0.7, // thinner border for better appearance when zoomed out
        color: outlineColor,
        fillOpacity: 0.7,
        ...(outlineGlow && {
          filter: "drop-shadow(0 0 6px " + outlineColor + ")",
        }),
      })}
      onEachFeature={(feature, layer) => {
        const code = feature.properties.ISO_A2;
        const count = countryCounts[code] || 0;
        layer.bindTooltip(`${feature.properties.ADMIN}: ${count}`);
        layer.on({
          click: () => onCountryClick(code),
        });
      }}
    />
  );
};

const SingleMarker = ({
  position,
  color = "#fec44f",
  children,
  setHighlightPointLocation = () => {},
}) => {
  return (
    <CircleMarker
      eventHandlers={{
        mouseover: (e) => setHighlightPointLocation(position.join(",")),
        mouseout: (e) => setHighlightPointLocation(""),
      }}
      center={position}
      color={"white"} // white outline
      stroke={true}
      weight={2} // thicker outline
      fillColor={color}
      fillOpacity={1}
    >
      {children}
    </CircleMarker>
  );
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
  mapProjection = "cylindricalEqualArea",
  // mapProjection = "mercator",
  ...props
}) => {
  const navigate = useNavigate();
  const componentRef = chartRef || useRef();
  const size = useResize(containerRef || componentRef);
  let { width, height } = size;
  const measured = size.width && size.height;
  width = width || 400;
  height = height || 300;
  const [globeView, setGlobeView] = useState(false);
  const [nightMode, setNightMode] = useState(theme === "darkTheme");
  const [crs, setCrs] = useState(() => getCrs(mapProjection, L));
  const [mapInstanceKey, setMapInstanceKey] = useState(0);
  const mapRef = useRef(null);

  // CRS setup (now synchronous)
  useEffect(() => {
    setCrs(getCrs(mapProjection, L));
    setMapInstanceKey((prev) => prev + 1);
  }, [mapProjection]);

  const darkColor = colorScheme?.[theme]?.darkColor || "#222a38";
  const lightColor = colorScheme?.[theme]?.lightColor || "#fff";
  const globeBg = nightMode
    ? "#0a0a1a"
    : theme === "darkTheme"
      ? lightColor
      : darkColor;
  const globeBgImg = nightMode
    ? "https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/night-sky.png"
    : null;
  const baseCountryBg = nightMode
    ? "#22262a"
    : theme === "darkTheme"
      ? colorScheme?.[theme]?.darkColor || "#222a38"
      : "#eeeeee";

  const countryOutlineColor = nightMode ? "#ffa870" : "#333";
  const oceanColor = nightMode ? "#0a1a2a" : "#b3d1e6";

  // --- BEGIN: Color Key Logic ---
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
  const useHexbin =
    map &&
    map.status &&
    map.report &&
    map.report.map.hexBinCounts &&
    Object.keys(map.report.map.hexBinCounts).length > 0;
  const overlayColor = useHexbin ? hexbinOverlayColor : countryOverlayColor;
  const maxCount = useHexbin ? maxHexbinCount : maxCountryCount;
  const keyValues = useMemo(() => {
    if (maxCount <= 1) {
      return [0, 1];
    }
    return [
      0,
      Math.round(maxCount * 0.25),
      Math.round(maxCount * 0.5),
      Math.round(maxCount * 0.75),
      maxCount,
    ];
  }, [maxCount]);
  const getKeyColor = (val) => {
    const bg = nightMode
      ? "#22262a"
      : theme === "darkTheme"
        ? "#222a38"
        : "#eeeeee";
    const ratio = Math.min(1, val / maxCount);
    mixColor({
      color1: overlayColor,
      color2: bg,
      ratio,
    });
  };
  useEffect(() => {
    if (message && map && map.status) {
      setMessage(null);
    }
  }, [map]);
  let options = qs.parse(location.search.replace(/^\?/, ""));
  if (map && map.status) {
    const { locationBounds, bounds } = map.report;
    let pointData = map.report.map.rawData || {};
    let geoBounds;
    if (locationBounds && locationBounds.stats.geo) {
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

      // Optionally, normalize bounds to [-180, 180]
      // geoBounds = geoBounds.map(([lat, lon]) => [
      //   lat,
      //   ((lon + 180) % 360) - 180,
      // ]);
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

    if (bounds.cats) {
      ({ levels, colors } = setColors({
        colorPalette,
        palettes,
        levels,
        count: bounds.cats.length,
        colors,
      }));
      bounds.cats.forEach((obj, i) => {
        if (globeView) {
          const points = MarkerComponent({
            geoPoints: pointData ? pointData[obj.key] : [],
            color: colors[i],
            options,
            basename,
            globeView: true,
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
            />,
          );
        }
      });
      if (bounds.showOther) {
        const i = bounds.cats.length;
        if (globeView) {
          const points = MarkerComponent({
            geoPoints: pointData["other"],
            color: colors[i],
            options,
            globeView: true,
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
            />,
          );
        }
      }
    } else if (globeView) {
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
      });
      pointsData.push(...points);
    } else {
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
    if (locationBounds?.stats?.geo?.bounds) {
      dataBounds = normalizeBounds(locationBounds.stats.geo.bounds);
    }
    let mapGlobe = null;
    if (globeView) {
      // Use Globe component for globe view
      mapGlobe = (
        <Globe
          key={`globe-${mapProjection}-${crs?.code || crs?.options?.code || ""}`}
          ref={mapRef}
          width={width}
          height={height}
          bounds={dataBounds}
          projectionBounds={projectionBounds}
          fitWorldBounds={fitWorldBounds}
          oceanColor={oceanColor}
          countryCounts={countryCounts}
          onCountryClick={handleCountryClick}
          globeBg={globeBg}
          globeBgImg={globeBgImg}
          baseCountryBg={baseCountryBg}
          countryOutlineColor={countryOutlineColor}
          countryOverlayColor={countryOverlayColor}
          hexBinCounts={hexBinCounts}
          hexbinOverlayColor={hexbinOverlayColor}
          maxBinCount={maxHexbinCount}
          markers={markers}
          {...props}
        />
      );
    } else if (measured && crs) {
      // Use Map component for flat map view
      mapGlobe = (
        <Map
          key={`map-${mapProjection}-${crs?.code || crs?.options?.code || ""}`}
          ref={mapRef}
          width={width}
          height={height}
          crs={crs}
          dataBounds={dataBounds}
          projectionBounds={projectionBounds}
          fitWorldBounds={fitWorldBounds}
          oceanColor={oceanColor}
          countryCounts={countryCounts}
          onCountryClick={handleCountryClick}
          baseCountryBg={baseCountryBg}
          countryOutlineColor={countryOutlineColor}
          countryOutlineGlow={nightMode}
          hexBinCounts={hexBinCounts}
          hexbinOverlayColor={hexbinOverlayColor}
          maxBinCount={maxHexbinCount}
          markers={markers}
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
          <div style={{ position: "relative", width, height }}>
            <MapLegend
              {...{
                nightMode,
                theme,
                globeView,
                setGlobeView,
                setNightMode,
                minCountryCount,
                maxCountryCount,
                countryOverlayColor,
                minHexbinCount,
                maxHexbinCount,
                hexbinOverlayColor,
              }}
            />
            {mapGlobe}
          </div>
        </Grid>
      );
    }
  } else {
    return null;
  }
};

export default compose(
  withSiteName,
  dispatchMessage,
  withColors,
  withTheme,
  withSearchIndex,
)(ReportMap);
