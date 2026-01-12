import "../style/leaflet.css";
import "leaflet/dist/leaflet.css";

import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { findCenterLatLng, getFitWorldZoom } from "./functions/mapHelpers";
import { useLocation, useNavigate } from "@reach/router";

import CountryPopup from "./CountryPopup";
import HexbinPopup from "./HexbinPopup";
import L from "leaflet";
import PointPopup from "./PointPopup";
import getMapOptions from "./functions/getMapOptions";
import hexBinsToGeoJson from "./functions/hexBinsToGeoJson";

let countriesGeoJson = null;
let countriesGeoJsonSimple = null;

// Component to track zoom level
const ZoomTracker = ({ setZoom }) => {
  const map = useMap();
  useEffect(() => {
    const handleZoom = () => {
      setZoom(map.getZoom());
    };
    map.on("zoomend", handleZoom);
    setZoom(map.getZoom()); // Set initial zoom
    return () => {
      map.off("zoomend", handleZoom);
    };
  }, [map, setZoom]);
  return null;
};

const CountryLayer = ({
  countryCounts,
  onCountryClick,
  countryColor = () => "#eeeeee",
  outlineColor = "#333",
  outlineGlow = false,
  countryLink = () => {},
  handleCountryClick = () => {},
  navigate = () => {},
}) => {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    if (!countriesGeoJson) {
      import("../geojson/countries.geojson").then((module) => {
        countriesGeoJson = module.default;
        setGeoData(countriesGeoJson);
      });
    } else {
      setGeoData(countriesGeoJson);
    }
  }, []);

  if (!geoData) return null;

  return (
    <GeoJSON
      data={{ type: "FeatureCollection", features: geoData.features }}
      style={(feature) => ({
        fillColor: countryColor(countryCounts[feature.properties.ISO_A2]),
        weight: 0.7,
        color: outlineColor,
        fillOpacity: 0.7,
        ...(outlineGlow && {
          filter: "drop-shadow(0 0 6px " + outlineColor + ")",
        }),
      })}
      onEachFeature={(feature, layer) => {
        const name = feature.properties.ADMIN || feature.properties.NAME;
        const iso = feature.properties.ISO_A2;
        const count = countryCounts[iso] || 0;
        const { coordinates } = feature.geometry;

        if (count > 0) {
          layer.on("click", () => {
            handleCountryClick({ name, iso, count, coordinates });
          });
        }
      }}
    />
  );
};

const Map = ({
  width,
  height,
  theme,
  colorScheme,
  nightMode,
  mapProjection = "mercator",
  regionField,
  crs,
  dataBounds,
  projectionBounds,
  fitWorldBounds,
  countryCounts,
  onCountryClick,
  hexBinCounts = {},
  countryOverlayColor = "#fec44f",
  hexbinOverlayColor = "#3182bd",
  maxBinCount = 1,
  regionLink = () => {},
  hexbinLink = () => {},
  pointLink = () => {},
  // markers = [],
  pointsData,
  reportSelect = "bin",
}) => {
  const mapContainerRef = useRef();
  const mapInstanceRef = useRef();
  const [countryPopupMeta, setCountryPopupMeta] = useState(null);
  const [hexbinPopupMeta, setHexbinPopupMeta] = useState(null);
  const [pointPopupMeta, setPointPopupMeta] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(0);

  const maxCount = useMemo(
    () => Math.max(...Object.values(countryCounts), 1),
    [countryCounts],
  );

  const hexbinMaxCount = useMemo(
    () => Math.max(...Object.values(hexBinCounts), 1),
    [hexBinCounts],
  );
  const showRegions = Boolean(regionField);
  const {
    mapOptions: {
      baseCountryBg,
      countryOutlineColor,
      countryOutlineGlow,
      oceanColor,
      lightColor,
      darkColor,
      tileUrl,
      tileAttribution,
      countryColor,
      hexbinColor,
    },
  } = getMapOptions({
    theme: "darkTheme",
    colorScheme,
    nightMode,
    mapProjection,
    showRegions,
    countryOverlayColor,
    hexbinOverlayColor,
    countryMaxCount: maxCount,
    hexbinMaxCount,
  });
  const navigate = useNavigate();

  // Only render MapContainer if width and height are valid and CRS is set
  if (!width || !height || !crs) {
    return null;
  }

  let hexBinFeatures = [];
  if (hexBinCounts && Object.keys(hexBinCounts).length > 0) {
    hexBinFeatures = hexBinsToGeoJson(hexBinCounts).features;
  }

  const isMercator =
    crs && (crs.code === "EPSG:3857" || crs.options?.code === "EPSG:3857");

  // If dataBounds are provided, zoom to fit data; else fit world
  let boundsToFit = projectionBounds.worldBounds;
  let dynamicZoom;

  if (dataBounds && dataBounds.length === 2) {
    boundsToFit = dataBounds;
    dynamicZoom = getFitWorldZoom(width, height, crs, boundsToFit, L, true);
  } else {
    dynamicZoom = getFitWorldZoom(width, height, crs, boundsToFit, L);
  }

  const [centerLat, centerLon] = findCenterLatLng(boundsToFit);
  const minZoom = getFitWorldZoom(
    width,
    height,
    crs,
    projectionBounds.worldBounds,
    L,
  );
  // Center the map after mount for all projections
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([centerLat, centerLon], dynamicZoom, {
        animate: false,
      });
    }
  }, [dynamicZoom, width, height, crs, dataBounds]); // oceanColor REMOVED from deps

  // Update map background color when oceanColor changes
  useEffect(() => {
    if (mapContainerRef.current) {
      const mapPane =
        mapContainerRef.current.querySelector(".leaflet-container");
      if (mapPane) {
        mapPane.style.background = oceanColor;
      }
    }
  }, [oceanColor]);

  const handleCountryClick = ({ name, iso, count, coordinates }) => {
    setHexbinPopupMeta(null); // Close hexbin popup if open
    setPointPopupMeta(null); // Close point popup if open
    setCountryPopupMeta({
      name,
      iso,
      count,
      coordinates,
    });
  };

  const handlePointClick = (point) => {
    setHexbinPopupMeta(null); // Close hexbin popup if open
    setCountryPopupMeta(null); // Close country popup if open
    setPointPopupMeta({
      fillColor: point.color || "#fec44f",
      catColor: point.color || "#fec44f",
      radius: point.radius || 0.8,
      ...point,
    });
  };
  let markers = [];
  if (pointsData && pointsData.length > 0) {
    markers = pointsData
      .map((point, i) => {
        const { lat, lng, color } = point;
        if (isNaN(lat) || isNaN(lng)) {
          return null; // Skip invalid coordinates
        }

        return (
          <CircleMarker
            key={i}
            center={[lat, lng]}
            color={"#fff"}
            fillColor={color || "#fec44f"}
            fillOpacity={1}
            // radius={6}
            eventHandlers={{
              click: () => handlePointClick(point),
            }}
          ></CircleMarker>
        );
      })
      .filter(Boolean); // Filter out null markers
  }

  let tileLayer;
  if (tileUrl) {
    tileLayer = <TileLayer url={tileUrl} attribution={tileAttribution} />;
  }

  let countryLayer;
  if (!tileUrl || showRegions) {
    countryLayer = (
      <CountryLayer
        countryCounts={countryCounts}
        onCountryClick={onCountryClick}
        countryColor={countryColor}
        outlineColor={countryOutlineColor}
        outlineGlow={countryOutlineGlow}
        handleCountryClick={handleCountryClick}
        countryLink={regionLink}
        navigate={navigate}
        showRegions={showRegions}
        zoomLevel={currentZoom}
      />
    );
  }

  const hexbinStyle = (count) => {
    if (!pointsData || pointsData.length == 0) {
      return {
        fillColor: hexbinColor(count),
        color: "none",
        fillOpacity: 0.8,
      };
    }
    if (reportSelect === "bin") {
      return {
        fillColor: "#eeeeee",
        color: "none",
        fillOpacity: 0.1,
      };
    }
    return {
      fillColor: "none",
      color: "none",
      fillOpacity: 0,
    };
  };

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        // marginTop: "1em",
        borderRadius: "32px",
        overflow: "hidden",
      }}
    >
      <MapContainer
        ref={mapInstanceRef}
        scrollWheelZoom={false}
        tap={false}
        style={{
          width: "100%",
          height: "100%",
          background: showRegions && oceanColor,
        }}
        crs={crs}
        minZoom={minZoom}
        maxZoom={minZoom + 6} // Allow some zooming in
        maxBounds={projectionBounds.worldBounds}
        maxBoundsViscosity={1.0}
        center={[centerLat, centerLon]}
        zoom={dynamicZoom}
      >
        <ZoomTracker setZoom={setCurrentZoom} />
        {tileLayer}
        {countryLayer}
        {reportSelect === "bin" && markers}
        {hexBinFeatures.length > 0 && (
          <GeoJSON
            data={hexBinsToGeoJson(hexBinCounts)}
            style={(feature) => hexbinStyle(feature.properties.count)}
            onEachFeature={(feature, layer) => {
              const { h3, count } = feature.properties;
              const style = hexbinStyle(count);
              layer.on("click", () => {
                if (reportSelect === "point") {
                  return; // Do not open hexbin popup in point mode
                }
                setCountryPopupMeta(null); // Close country popup if open
                setPointPopupMeta(null); // Close point popup if open
                setHexbinPopupMeta({
                  h3,
                  count,
                  style,
                });
              });
            }}
          />
        )}
        {reportSelect === "point" && markers}
      </MapContainer>
      {countryPopupMeta && (
        <CountryPopup
          theme={theme}
          nightMode={nightMode}
          setCountryPopup={setCountryPopupMeta}
          countryPopupMeta={countryPopupMeta}
          regionLink={regionLink}
          navigate={navigate}
          oceanColor={oceanColor}
          countryColor={countryColor}
          countryOutlineColor={countryOutlineColor}
        />
      )}
      {hexbinPopupMeta && (
        <HexbinPopup
          theme={theme}
          nightMode={nightMode}
          setHexbinPopupMeta={setHexbinPopupMeta}
          hexbinPopupMeta={hexbinPopupMeta}
          hexbinLink={hexbinLink}
          navigate={navigate}
          fill={hexbinPopupMeta.style.fillColor}
          opacity={hexbinPopupMeta.style.fillOpacity}
          stroke={hexbinPopupMeta.style.color}
          oceanColor={oceanColor}
        />
      )}
      {pointPopupMeta && (
        <PointPopup
          theme={theme}
          nightMode={nightMode}
          setPointPopupMeta={setPointPopupMeta}
          pointPopupMeta={pointPopupMeta}
          navigate={navigate}
          oceanColor={oceanColor}
          pointLink={pointLink}
        />
      )}
    </div>
  );
};

export default Map;
