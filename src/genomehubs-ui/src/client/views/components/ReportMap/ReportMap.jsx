import "leaflet/dist/leaflet.css";

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
import { useLocation, useNavigate } from "@reach/router";

import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Globe from "react-globe.gl";
import Grid from "@mui/material/Grid2";
import MarkerComponent from "./functions/MarkerComponent";
import { MeshPhongMaterial } from "three";
import NavLink from "../NavLink";
import Skeleton from "@mui/material/Skeleton";
import Switch from "@mui/material/Switch";
import { cellToBoundary } from "h3-js";
import { compose } from "recompose";
import countriesGeoJson from "../geojson/countries.geojson";
import dispatchMessage from "../../hocs/dispatchMessage";
import getCountryColor from "./functions/getCountryColor";
import hexBinsToGeoJson from "./functions/hexBinsToGeoJson";
import { mixColor } from "../../functions/mixColor";
import qs from "../../functions/qs";
import setColors from "../../functions/setColors";
import shiftFeature from "./functions/shiftFeature";
import useResize from "../../hooks/useResize";
import withColors from "#hocs/withColors";
import withSearchIndex from "../../hocs/withSearchIndex";
import withSiteName from "#hocs/withSiteName";
import withTheme from "#hocs/withTheme";

// Default region attribute (user-editable in future)
const REGION_ATTRIBUTE = "country_code";

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

const Map = ({
  bounds,
  markers,
  width,
  height,
  geoPoints = [],
  zoom = 10,
  meta = {},
  taxonId,
  countryCounts,
  palette,
  onCountryClick,
  globeView = false,
  colorScheme = {},
  theme = "lightTheme",
  pointsData = [],
  hexBinCounts = {},
  nightMode = false,
}) => {
  const location = useLocation();
  const globeRef = useRef();
  const mapContainerRef = useRef(); // always call useRef, unconditionally
  const [globeLoading, setGlobeLoading] = useState(true); // <-- ensure this is defined in Map
  const [showGlobe, setShowGlobe] = useState(false); // <-- move this up to top-level, before any conditional logic
  // Calculate center of bounds for zoom
  let centerLat = 0,
    centerLon = 0;
  if (bounds && bounds.length === 2) {
    centerLat = (bounds[0][0] + bounds[1][0]) / 2;
    centerLon = (bounds[0][1] + bounds[1][1]) / 2;
  }
  const darkColor = colorScheme?.[theme]?.darkColor || "#222a38";
  const lightColor = colorScheme?.[theme]?.lightColor || "#fff";
  const maxCount = useMemo(
    () => Math.max(...Object.values(countryCounts), 1),
    [countryCounts],
  );
  const baseCountryBg = nightMode
    ? "#22262a"
    : theme === "darkTheme"
      ? darkColor
      : "#eeeeee";
  const countryOutlineColor = nightMode ? "#ffa870" : "#333";
  const countryOutlineGlow = nightMode;
  const getPolyColor = useCallback(
    (d) =>
      getCountryColor(
        countryCounts[d.properties.ISO_A2],
        maxCount,
        undefined,
        baseCountryBg,
      ),
    [countryCounts, maxCount, baseCountryBg],
  );
  const getPolyLabel = useCallback(
    (d) => `${d.properties.ADMIN}: ${countryCounts[d.properties.ISO_A2] || 0}`,
    [countryCounts],
  );
  const getPolySideColor = useCallback(() => "rgba(0,0,0,0.15)", []);
  const getPolyStrokeColor = useCallback(() => "rgba(0,0,0,0.15)", []);
  const handlePolyClick = useCallback(
    (d) => onCountryClick(d.properties.ISO_A2),
    [onCountryClick],
  );
  // Imperatively update Leaflet container background on color change
  useEffect(() => {
    if (!globeView && mapContainerRef.current) {
      // Always query for .leaflet-container inside the wrapper div
      const leaflet =
        mapContainerRef.current.querySelector(".leaflet-container");
      if (leaflet) {
        leaflet.style.background = oceanColor;
      }
    }
  }, [oceanColor, globeView, nightMode]);

  // HEXBIN LAYER SETUP
  let hexBinFeatures = [];
  if (hexBinCounts && Object.keys(hexBinCounts).length > 0) {
    hexBinFeatures = hexBinsToGeoJson(hexBinCounts).features;
  }

  const maxBinCount = Math.max(
    ...hexBinFeatures.map((f) => f.properties.count),
    1,
  );

  const oceanColor = nightMode ? "#0a1a2a" : "#b3d1e6";

  // NEW: Delay mounting Globe so spinner/background are painted first
  useEffect(() => {
    if (globeView) {
      setShowGlobe(false);
      const t = setTimeout(() => setShowGlobe(true), 30); // 30ms delay
      return () => clearTimeout(t);
    } else {
      setShowGlobe(false);
    }
  }, [globeView]);

  // Ensure globe zooms to bounds when showGlobe becomes true
  useEffect(() => {
    if (globeView && showGlobe && globeRef.current) {
      if (pointsData && pointsData.length > 0) {
        const lats = pointsData.map((p) => p.lat);
        const lngs = pointsData.map((p) => p.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        const latSpread = maxLat - minLat;
        const lngSpread = maxLng - minLng;
        const spread = Math.max(latSpread, lngSpread);
        const altitude = Math.min(Math.max(1.2 + spread / 120, 1.2), 2);
        globeRef.current.pointOfView(
          { lat: centerLat, lng: centerLng, altitude },
          1000,
        );
      } else {
        globeRef.current.pointOfView(
          { lat: centerLat, lng: centerLon, altitude: 1.5 },
          1000,
        );
      }
    }
  }, [globeView, showGlobe, centerLat, centerLon, pointsData]);

  if (width === 0) {
    return null;
  }
  if (globeView) {
    // Build combined pointsData with outline and center for each point
    const combinedPointsData = [];
    for (const pt of pointsData) {
      combinedPointsData.push({ ...pt, isOutline: true }); // white outline
      combinedPointsData.push({ ...pt, isOutline: false, label: pt.label }); // colored center with label
    }
    const globeBg = nightMode
      ? "#0a0a1a"
      : theme === "darkTheme"
        ? lightColor
        : darkColor;
    const globeBgImg = nightMode
      ? "https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/night-sky.png"
      : null;
    return (
      <div
        style={{
          width,
          height,
          background: globeBg,
          marginTop: "1em",
          position: "relative",
        }}
      >
        {/* Always render skeleton overlay and background immediately */}
        {(globeLoading || !showGlobe) && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: nightMode
                ? "#0a0a1a"
                : theme === "darkTheme"
                  ? darkColor
                  : "#fff",
              opacity: 0.85,
              zIndex: 10,
            }}
          >
            {/* Use min(width, height) for a true circle */}
            <Skeleton
              variant="circular"
              width={Math.max(Math.min(width, height) * 0.75, 200)}
              height={Math.max(Math.min(width, height) * 0.75, 200)}
              animation="wave"
              sx={{ bgcolor: nightMode ? "#444" : "#f3f3f3" }}
            />
          </div>
        )}
        {/* Only mount Globe after short delay so skeleton/background are painted first */}
        {showGlobe && (
          <Globe
            ref={globeRef}
            width={width}
            height={height}
            backgroundColor={globeBg}
            backgroundImageUrl={globeBgImg}
            rendererConfig={{ alpha: true }}
            showGlobe={true}
            globeMaterial={new MeshPhongMaterial({ color: oceanColor })}
            polygonsData={countriesGeoJson.features}
            polygonCapColor={getPolyColor}
            polygonStrokeColor={() => countryOutlineColor}
            polygonLabel={getPolyLabel}
            onPolygonClick={handlePolyClick}
            polygonSideColor={"rgba(0, 0, 0, 0.0)"}
            polygonAltitude={(d) =>
              countryCounts[d.properties.ISO_A2] > 0 ? 0.01 : 0.01
            }
            pointsData={combinedPointsData}
            pointLat={(d) => d.lat}
            pointLng={(d) => d.lng}
            pointColor={(d) => (d.isOutline ? "#fff" : d.color)}
            pointAltitude={(d) => (d.isOutline ? 0.022 : 0.025)}
            pointRadius={(d) => (d.isOutline ? 0.45 : 0.32)}
            pointResolution={16}
            pointLabel={(d) => d.label}
            // HEXBIN LAYER
            hexPolygonsData={hexBinFeatures}
            hexPolygonResolution={2}
            hexPolygonMargin={0.05}
            hexPolygonPoints={(d) => d.geometry.coordinates[0]}
            hexPolygonColor={(d) =>
              mixColor({
                color1: "#70ff01",
                color2: "#eeeeee",
                ratio: Math.min(1, d.properties.count / maxBinCount),
              }) + "cc"
            }
            hexPolygonAltitude={0.015}
            hexPolygonLabel={(d) =>
              `Hex: ${d.properties.h3}\nCount: ${d.properties.count}`
            }
            onGlobeReady={() => setGlobeLoading(false)}
          />
        )}
      </div>
    );
  }
  // Wrap MapContainer in a div with a ref for reliable DOM access
  return (
    <div
      ref={mapContainerRef}
      style={{ width: `${width}px`, height: `${height}px`, marginTop: "1em" }}
    >
      <MapContainer
        bounds={bounds}
        scrollWheelZoom={false}
        tap={false}
        style={{
          width: "100%",
          height: "100%",
          background: oceanColor,
        }}
      >
        <CountryLayer
          countryCounts={countryCounts}
          onCountryClick={onCountryClick}
          repeat={true}
          baseBg={baseCountryBg}
          outlineColor={countryOutlineColor}
          outlineGlow={countryOutlineGlow}
        />
        {/* markers */}
        {hexBinFeatures.length > 0 && (
          <GeoJSON
            data={hexBinsToGeoJson(hexBinCounts)}
            style={(feature) => {
              const { count } = feature.properties;
              const fillColor = mixColor({
                color1: "#70ff01",
                color2: "#eeeeee",
                ratio: Math.min(1, count / maxBinCount),
              });
              return {
                fillColor,
                color: "none",
                fillOpacity: 0.8,
              };
            }}
            onEachFeature={(feature, layer) => {
              layer.bindTooltip(
                `Hex: ${feature.properties.h3} Count: ${feature.properties.count}`,
              );
            }}
          />
        )}
      </MapContainer>
    </div>
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
}) => {
  const navigate = useNavigate();
  const componentRef = chartRef || useRef();
  const size = useResize(containerRef || componentRef);
  const { width, height } = size;
  const [globeView, setGlobeView] = useState(true);
  console.log(theme);
  const [nightMode, setNightMode] = useState(theme === "darkTheme");
  const [globeLoading, setGlobeLoading] = useState(true);
  useEffect(() => {
    if (message && map && map.status) {
      setMessage(null);
    }
  }, [map]);
  let options = qs.parse(location.search.replace(/^\?/, ""));
  if (map && map.status) {
    const { locationBounds, bounds } = map.report.map;
    let pointData = map.report.map.rawData;
    if (!pointData && map.report.map.map) {
      pointData = map.report.map.map.rawData || {};
    }
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
    if (!regionCounts && map.report.map.map) {
      ({ regionCounts, hexBinCounts } = map.report.map.map);
    }
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
    return (
      <Grid ref={componentRef} style={{ height: "100%" }} size="grow">
        <FormGroup
          row
          style={{
            position: "absolute",
            zIndex: 1000,
            right: 20,
            top: 20,
            background: nightMode
              ? "rgba(30,30,30,0.85)"
              : theme === "darkTheme"
                ? "rgba(34,42,56,0.85)"
                : "rgba(255,255,255,0.85)",
            borderRadius: 12,
            boxShadow:
              nightMode || theme === "darkTheme"
                ? "0 2px 8px #0008"
                : "0 2px 8px #8882",
            padding: "0.5em 1em",
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={globeView}
                onClick={() => setGlobeView(!globeView)}
                color={
                  nightMode || theme === "darkTheme" ? "default" : "primary"
                }
                sx={
                  nightMode || theme === "darkTheme"
                    ? {
                        "& .MuiSwitch-switchBase": {
                          color: "#bbb",
                        },
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "#ffa870",
                        },
                        "& .MuiSwitch-track": {
                          backgroundColor: "#888",
                        },
                      }
                    : {}
                }
              />
            }
            label={globeView ? "Globe" : "Map"}
            sx={nightMode || theme === "darkTheme" ? { color: "#eee" } : {}}
          />
          <FormControlLabel
            control={
              <Switch
                checked={nightMode}
                onClick={() => setNightMode(!nightMode)}
                color={
                  nightMode || theme === "darkTheme" ? "default" : "primary"
                }
                sx={
                  nightMode || theme === "darkTheme"
                    ? {
                        "& .MuiSwitch-switchBase": {
                          color: "#bbb",
                        },
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "#ffa870",
                        },
                        "& .MuiSwitch-track": {
                          backgroundColor: "#888",
                        },
                      }
                    : {}
                }
              />
            }
            label={nightMode ? "Night" : "Day"}
            sx={nightMode || theme === "darkTheme" ? { color: "#eee" } : {}}
          />
        </FormGroup>
        {/* Map or Globe rendering logic goes here */}
        <Map
          bounds={geoBounds}
          markers={markers}
          width={width}
          height={height}
          countryCounts={countryCounts}
          onCountryClick={handleCountryClick}
          globeView={globeView}
          colorScheme={colorScheme}
          theme={theme || "lightTheme"}
          pointsData={pointsData}
          hexBinCounts={hexBinCounts}
          nightMode={nightMode}
        />
      </Grid>
    );
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
