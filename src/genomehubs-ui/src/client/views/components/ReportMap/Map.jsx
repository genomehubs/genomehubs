import { CircleMarker, GeoJSON, MapContainer } from "react-leaflet";
import L, { bounds } from "leaflet";
import React, { forwardRef, useEffect, useRef } from "react";
import {
  findCenterLatLng,
  getFitWorldZoom,
  getMercatorMinZoom,
} from "./functions/mapHelpers";

import countriesGeoJson from "../geojson/countries.geojson";
import getCountryColor from "./functions/getCountryColor";
import hexBinsToGeoJson from "./functions/hexBinsToGeoJson";
import { mixColor } from "../../functions/mixColor";

const CountryLayer = ({
  countryCounts,
  onCountryClick,
  repeat = false,
  baseBg = "#eeeeee",
  outlineColor = "#333",
  outlineGlow = false,
}) => {
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

const Map = forwardRef(
  (
    {
      width,
      height,
      crs,
      dataBounds,
      projectionBounds,
      fitWorldBounds,
      oceanColor = "#b3d1e6",
      countryCounts,
      onCountryClick,
      baseCountryBg,
      countryOutlineColor,
      countryOutlineGlow,
      hexBinCounts = {},
      hexbinOverlayColor = "#3182bd",
      maxBinCount = 1,
      markers = [],
      ...props
    },
    ref,
  ) => {
    const mapContainerRef = useRef();
    const mapInstanceRef = useRef();

    // Expose map instance to parent if ref is provided
    React.useImperativeHandle(ref, () => mapInstanceRef.current, []);

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
    }, [dynamicZoom, width, height, crs, dataBounds]);

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

    return (
      <div
        ref={mapContainerRef}
        style={{ width: `${width}px`, height: `${height}px`, marginTop: "1em" }}
      >
        <MapContainer
          ref={mapInstanceRef}
          scrollWheelZoom={false}
          tap={false}
          style={{ width: "100%", height: "100%", background: oceanColor }}
          crs={crs}
          minZoom={minZoom}
          maxZoom={minZoom + 6} // Allow some zooming in
          maxBounds={projectionBounds.worldBounds}
          maxBoundsViscosity={1.0}
          center={[centerLat, centerLon]}
          zoom={dynamicZoom}
          // {...(isMercator
          //   ? { center: [centerLat, centerLon], zoom: dynamicZoom }
          //   : {
          //       bounds: boundsToFit,
          //       boundsOptions: { animate: false, padding: [0, 0] },
          //     })}
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
                  color1: hexbinOverlayColor,
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
          {markers}
        </MapContainer>
      </div>
    );
  },
);

export default Map;
