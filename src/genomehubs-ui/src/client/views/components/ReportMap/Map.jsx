import { CircleMarker, GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import React, { useMemo, useRef } from "react";
import { findCenterLatLng, getFitWorldZoom } from "./functions/mapHelpers";

import L from "leaflet";
import countriesGeoJson from "../geojson/countries.geojson";
import getMapOptions from "./functions/getMapOptions";
import hexBinsToGeoJson from "./functions/hexBinsToGeoJson";

const CountryLayer = ({
  countryCounts,
  onCountryClick,
  countryColor = () => "#eeeeee",
  outlineColor = "#333",
  outlineGlow = false,
}) => {
  return (
    <GeoJSON
      data={{ type: "FeatureCollection", features: countriesGeoJson.features }}
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
        const code = feature.properties.ISO_A2;
        const count = countryCounts[code] || 0;
        // Ensure only one tooltip is open at a time
        layer.on("mouseover", function (e) {
          // Close all other tooltips
          layer._map.eachLayer((l) => {
            if (l.closeTooltip && l !== layer) {
              l.closeTooltip();
            }
          });
          layer
            .bindTooltip(`${feature.properties.ADMIN}: ${count}`, {
              permanent: false,
            })
            .openTooltip();
        });
        layer.on("mouseout", function () {
          this.closeTooltip();
        });
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
}) => (
  <CircleMarker
    eventHandlers={{
      mouseover: (e) => setHighlightPointLocation(position.join(",")),
      mouseout: (e) => setHighlightPointLocation(""),
    }}
    center={position}
    color={"white"}
    stroke={true}
    weight={2}
    fillColor={color}
    fillOpacity={1}
  >
    {children}
  </CircleMarker>
);

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
  markers = [],
}) => {
  const mapContainerRef = useRef();
  const mapInstanceRef = useRef();
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
  React.useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([centerLat, centerLon], dynamicZoom, {
        animate: false,
      });
    }
  }, [dynamicZoom, width, height, crs, dataBounds]); // oceanColor REMOVED from deps

  // Update map background color when oceanColor changes
  React.useEffect(() => {
    if (mapContainerRef.current) {
      const mapPane =
        mapContainerRef.current.querySelector(".leaflet-container");
      if (mapPane) {
        mapPane.style.background = oceanColor;
      }
    }
  }, [oceanColor]);

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
      />
    );
  }

  return (
    <div
      ref={mapContainerRef}
      style={{ width: `${width}px`, height: `${height}px`, marginTop: "1em" }}
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
        {tileLayer}
        {countryLayer}
        {/* markers */}
        {hexBinFeatures.length > 0 && (
          <GeoJSON
            data={hexBinsToGeoJson(hexBinCounts)}
            style={(feature) => {
              return {
                fillColor: hexbinColor(feature.properties.count),
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
        {markers}
      </MapContainer>
    </div>
  );
};

export default Map;
