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
import MultiCatLegend, { processLegendData } from "../MultiCatLegend";
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
import LocationMapHighlightIcon from "../LocationMapHighlightIcon";
import { MeshPhongMaterial } from "three";
import NavLink from "../NavLink";
import Switch from "@mui/material/Switch";
import ZoomComponent from "../ZoomComponent";
import { cellToBoundary } from "h3-js";
import { compose } from "recompose";
import countriesGeoJson from "../geojson/countries.geojson";
import dispatchMessage from "../../hocs/dispatchMessage";
import { mixColor } from "../../functions/mixColor";
import qs from "../../functions/qs";
import setColors from "../../functions/setColors";
import useResize from "../../hooks/useResize";
import withColors from "#hocs/withColors";
import withSearchIndex from "../../hocs/withSearchIndex";
import withSiteName from "#hocs/withSiteName";

// Utility to get color based on count
function getCountryColor(count, maxCount, baseColor = "#ff7001") {
  if (!count) {
    return "#eee";
  }
  // Blend baseColor with #eeeeee proportional to count
  const ratio = count / maxCount;
  return mixColor({ color1: baseColor, color2: "#eeeeee", ratio });
}

// Default region attribute (user-editable in future)
const REGION_ATTRIBUTE = "country_code";

const CountryLayer = ({ countryCounts, onCountryClick, repeat = false }) => {
  // Find max count for color scaling
  const maxCount = Math.max(...Object.values(countryCounts), 1);

  // Helper to shift a polygon's longitude
  const shiftFeature = (feature, shift) => {
    const newFeature = JSON.parse(JSON.stringify(feature));
    const shiftCoords = (coords) => {
      return coords.map((c) =>
        Array.isArray(c[0]) ? shiftCoords(c) : [c[0] + shift, c[1]],
      );
    };
    if (feature.geometry.type === "Polygon") {
      newFeature.geometry.coordinates = shiftCoords(
        feature.geometry.coordinates,
      );
    } else if (feature.geometry.type === "MultiPolygon") {
      newFeature.geometry.coordinates =
        feature.geometry.coordinates.map(shiftCoords);
    }
    return newFeature;
  };

  // Build repeated features
  let { features } = countriesGeoJson;
  if (repeat) {
    const shifts = [-360, 0, 360];
    features = shifts.flatMap((shift) =>
      shift === 0
        ? countriesGeoJson.features
        : countriesGeoJson.features.map((f) => shiftFeature(f, shift)),
    );
  }

  return (
    <GeoJSON
      data={{ type: "FeatureCollection", features }}
      style={(feature) => ({
        fillColor: getCountryColor(
          countryCounts[feature.properties.ISO_A2],
          maxCount,
        ),
        weight: 1,
        color: "#333",
        fillOpacity: 0.7,
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

const MarkerComponent = ({
  geoPoints = [],
  color,
  meta,
  options,
  taxonId,
  setHighlightPointLocation = () => {},
  basename,
  globeView = false,
}) => {
  if (globeView) {
    // Return array of point data objects for react-globe.gl
    let points = [];
    for (const obj of geoPoints) {
      const { coords: rawCoords } = obj;
      const coords = Array.isArray(rawCoords) ? rawCoords : [rawCoords];
      for (const latLon of coords) {
        if (!latLon) {
          continue;
        }
        const arr = latLon.split(",");
        if (arr.length !== 2) {
          continue;
        }
        const lat = parseFloat(arr[0]);
        const lng = parseFloat(arr[1]);
        if (isNaN(lat) || isNaN(lng)) {
          continue;
        }
        // Build label string similar to map marker
        let message = obj.scientific_name ? `${obj.scientific_name} - ` : "";
        let link;
        if (obj.sampleId) {
          link = `${basename || ""}/record?recordId=${obj.sampleId}&result=sample&taxonomy=${options.taxonomy}`;
          message += obj.sampleId ? `Sample: ${obj.sampleId}` : "";
        } else if (obj.taxonId) {
          const newOptions = {
            query: `tax_tree(${obj.taxonId}) AND sample_location=${latLon}`,
            result: "sample",
            taxonomy: options.taxonomy,
          };
          const url = `${basename || ""}/search?${qs.stringify(newOptions)}`;
          link = url;
          message += "Click to view samples from this location";
        }
        // For globe tooltip, use plain text (no HTML/JSX)
        let label = message;
        if (link) {
          label += `\n${link}`;
        }
        points.push({
          lat,
          lng,
          color,
          label,
          ...obj,
        });
      }
    }
    return points;
  }

  let markers = [];
  let i = 0;
  for (const obj of geoPoints) {
    const { coords: rawCoords } = obj;
    const coords = Array.isArray(rawCoords) ? rawCoords : [rawCoords];
    for (const latLon of coords) {
      if (!latLon) {
        continue;
      }
      const arr = latLon.split(",");
      let message = obj.scientific_name ? `${obj.scientific_name} - ` : "";
      let link;
      if (obj.sampleId) {
        link = (
          <NavLink
            url={`${basename || ""}/record?recordId=${
              obj.sampleId
            }&result=sample&taxonomy=${options.taxonomy}`}
          >
            {obj.sampleId}
          </NavLink>
        );
      } else if (obj.taxonId) {
        const newOptions = {
          query: `tax_tree(${obj.taxonId}) AND sample_location=${latLon}`,
          result: "sample",
          taxonomy: options.taxonomy,
        };
        const url = `${basename || ""}/search?${qs.stringify(newOptions)}`;
        link = (
          <NavLink url={url}>click to view samples from this location</NavLink>
        );
      }
      message = (
        <>
          {message} {link}
        </>
      );
      markers.push(
        <SingleMarker
          key={i}
          position={arr}
          color={color}
          setHighlightPointLocation={setHighlightPointLocation}
        >
          <Popup>{message}</Popup>
        </SingleMarker>,
      );
      i++;
    }
  }
  return markers;
};

// Utility to convert hexBinCounts to GeoJSON FeatureCollection
const hexBinsToGeoJson = (hexBinCounts) => {
  return {
    type: "FeatureCollection",
    features: Object.entries(hexBinCounts).map(([h3, count]) => {
      const coords = cellToBoundary(h3, true);
      // Ensure polygon is closed (first and last point are the same)
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
    }),
  };
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
}) => {
  const location = useLocation();
  const globeRef = useRef();
  // Calculate center of bounds for zoom
  let centerLat = 0,
    centerLon = 0;
  if (bounds && bounds.length === 2) {
    centerLat = (bounds[0][0] + bounds[1][0]) / 2;
    centerLon = (bounds[0][1] + bounds[1][1]) / 2;
  }
  const darkColor = colorScheme?.[theme]?.darkColor || "#222a38";
  const maxCount = useMemo(
    () => Math.max(...Object.values(countryCounts), 1),
    [countryCounts],
  );
  const getPolyColor = useCallback(
    (d) => getCountryColor(countryCounts[d.properties.ISO_A2], maxCount),
    [countryCounts, maxCount],
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
  useEffect(() => {
    if (globeView && globeRef.current) {
      if (pointsData && pointsData.length > 0) {
        // Calculate centroid and spread
        const lats = pointsData.map((p) => p.lat);
        const lngs = pointsData.map((p) => p.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        // Calculate max distance between points (roughly)
        const latSpread = maxLat - minLat;
        const lngSpread = maxLng - minLng;
        // Altitude: tighter zoom (50% closer)
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
  }, [globeView, centerLat, centerLon, pointsData]);
  if (width === 0) {
    return null;
  }
  // HEXBIN LAYER SETUP
  let hexBinFeatures = [];
  if (hexBinCounts && Object.keys(hexBinCounts).length > 0) {
    hexBinFeatures = hexBinsToGeoJson(hexBinCounts).features;
  }
  console.log("hexBinFeatures", hexBinFeatures);

  if (globeView) {
    // Build combined pointsData with outline and center for each point
    const combinedPointsData = [];
    for (const pt of pointsData) {
      combinedPointsData.push({ ...pt, isOutline: true }); // white outline
      combinedPointsData.push({ ...pt, isOutline: false, label: pt.label }); // colored center with label
    }
    return (
      <div style={{ width, height, background: darkColor, marginTop: "1em" }}>
        <Globe
          ref={globeRef}
          width={width}
          height={height}
          backgroundColor={"rgba(0,0,0,0)"}
          backgroundImageUrl={null}
          rendererConfig={{ alpha: true }}
          showGlobe={true}
          globeMaterial={new MeshPhongMaterial({ color: "#b3d1e6" })}
          polygonsData={countriesGeoJson.features}
          polygonCapColor={getPolyColor}
          polygonStrokeColor={getPolyStrokeColor}
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
          hexPolygonPoints={(d) => d.geometry.coordinates[0]}
          hexPolygonColor={(d) =>
            mixColor({
              color1: "#70ff01",
              color2: "#eeeeee",
              ratio: Math.min(
                1,
                d.properties.count /
                  Math.max(...hexBinFeatures.map((f) => f.properties.count), 1),
              ),
            })
          }
          hexPolygonAltitude={0.011}
          hexPolygonLabel={(d) =>
            `Hex: ${d.properties.h3}\nCount: ${d.properties.count}`
          }
        />
      </div>
    );
  }
  return (
    <MapContainer
      bounds={bounds}
      scrollWheelZoom={false}
      tap={false}
      style={{
        marginTop: "1em",
        width: `${width}px`,
        height: `${height}px`,
        background: "#b3d1e6",
      }}
    >
      {/* <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
      /> */}
      <CountryLayer
        countryCounts={countryCounts}
        onCountryClick={onCountryClick}
        repeat={true}
      />
      {/* markers */}
      {hexBinFeatures.length > 0 && (
        <GeoJSON
          data={hexBinsToGeoJson(hexBinCounts)}
          style={(feature) => {
            const { count } = feature.properties;
            const maxCount = Math.max(...hexBinFeatures.map((f) => f.count), 1);
            return {
              fillColor: mixColor({
                color1: "#7001ff",
                color2: "#eeeeee",
                ratio: Math.min(1, count / maxCount),
              }),
              weight: 1,
              color: "#333",
              fillOpacity: 0.7,
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
  const { width, height } = containerRef
    ? useResize(containerRef)
    : useResize(componentRef);
  const [globeView, setGlobeView] = useState(true);
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
          style={{ position: "absolute", zIndex: 1000, right: 20, top: 20 }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={globeView}
                onChange={() => setGlobeView((v) => !v)}
                color="primary"
              />
            }
            label={globeView ? "Globe View" : "Map View"}
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
  withSearchIndex,
)(ReportMap);
