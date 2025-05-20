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
      color={"white"}
      stroke={1}
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
}) => {
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
        // if (options.recordId) {
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
      // TODO: handle assemblyId
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
      globeRef.current.pointOfView(
        { lat: centerLat, lng: centerLon, altitude: 1.5 },
        1000,
      );
    }
  }, [globeView, centerLat, centerLon]);
  if (width === 0) {
    return null;
  }
  if (globeView) {
    return (
      <div style={{ width, height, background: darkColor, marginTop: "1em" }}>
        <Globe
          ref={globeRef}
          width={width}
          height={height}
          backgroundColor={darkColor}
          backgroundImageUrl={null}
          showGlobe={true}
          globeMaterial={new MeshPhongMaterial({ color: "#b3d1e6" })}
          polygonsData={countriesGeoJson.features}
          polygonCapColor={getPolyColor}
          // polygonSideColor={getPolySideColor}
          polygonStrokeColor={getPolyStrokeColor}
          polygonLabel={getPolyLabel}
          onPolygonClick={handlePolyClick}
          polygonSideColor={"rgba(0, 0, 0, 0.0)"}
          // polygonStrokeColor={getPolyColor}
          polygonAltitude={(d) =>
            countryCounts[d.properties.ISO_A2] > 0 ? 0.01 : 0.01
          }
        />
        {markers}
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
      {markers}
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
    const { bounds } = map.report.map;
    let geoBounds = bounds.stats.geo.bounds;
    geoBounds = [
      [geoBounds.top_left.lat + 1, geoBounds.top_left.lon - 1],
      [geoBounds.bottom_right.lat - 1, geoBounds.bottom_right.lon + 1],
    ];
    const pointData = map.report.map.map.rawData;
    let markers = [];
    // Calculate country counts
    const countryCounts = {};
    Object.values(pointData)
      .flat()
      .forEach((obj) => {
        ([obj[REGION_ATTRIBUTE]].flat() || []).forEach((code) => {
          countryCounts[code] = (countryCounts[code] || 0) + 1;
        });
      });
    if (bounds.cats) {
      ({ levels, colors } = setColors({
        colorPalette,
        palettes,
        levels,
        count: bounds.cats.length,
        colors,
      }));
      bounds.cats.forEach((obj, i) => {
        markers.push(
          <MarkerComponent
            key={i}
            geoPoints={pointData[obj.key]}
            color={colors[i]}
            options={options}
            basename={basename}
          />,
        );
      });
      if (bounds.showOther) {
        const i = bounds.cats.length;
        // markers.push(
        //   <MarkerComponent
        //     key={i}
        //     geoPoints={pointData["other"]}
        //     color={colors[i]}
        //     options={options}
        //   />,
        // );
      }
    } else {
      // markers.push(
      //   <MarkerComponent
      //     key={0}
      //     geoPoints={pointData[`all ${searchIndexPlural}`]}
      //     color={colors[0]}
      //     options={options}
      //   />,
      // );
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
