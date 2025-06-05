import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Popup,
  TileLayer,
} from "react-leaflet";
import React, { useMemo, useRef } from "react";
import { findCenterLatLng, getFitWorldZoom } from "./functions/mapHelpers";
import { useLocation, useNavigate } from "@reach/router";

import CountryPopup from "./CountryPopup";
import HexbinPopup from "./HexbinPopup";
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
  countryLink = () => {},
  handleCountryClick = () => {},
  navigate = () => {},
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
        const name = feature.properties.ADMIN || feature.properties.NAME;
        const iso = feature.properties.ISO_A2;
        const count = countryCounts[iso] || 0;
        const coordinates = feature.geometry.coordinates;

        if (count > 0) {
          // layer.bindPopup(
          //   `<div style="font-size: 1.2em;">
          //     <strong>${feature.properties.ADMIN} (${feature.properties.ISO_A2})</strong>
          //     <br/>
          //     <strong>Count:</strong> ${count}
          //     <br/>
          //     <a href="${countryLinkUrl}" class="country-link" data-iso="${isoCode}">Click to search</a>
          //   </div>`,
          // );
          // layer.on("popupopen", function (e) {
          //   const link = e.popup._contentNode.querySelector(".country-link");
          //   if (link) {
          //     link.addEventListener("click", function (evt) {
          //       evt.preventDefault();
          //       if (typeof countryLink === "function") {
          //         const url = countryLink(isoCode);
          //         if (url) {
          //           navigate(url);
          //         }
          //       }
          //     });
          //   }
          // });
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
  markers = [],
}) => {
  const mapContainerRef = useRef();
  const mapInstanceRef = useRef();
  const [countryPopupMeta, setCountryPopupMeta] = React.useState(null);
  const [hexbinPopupMeta, setHexbinPopupMeta] = React.useState(null);
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

  const handleCountryClick = ({ name, iso, count, coordinates }) => {
    setCountryPopupMeta({
      name,
      iso,
      count,
      coordinates,
    });
  };

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
              const { h3, count } = feature.properties;
              const hexbinLinkUrl = hexbinLink(h3);

              // layer.bindPopup(
              //   `<div style="font-size: 1.2em;">
              //     <strong>H3 Index:</strong> ${h3}<br/>
              //     <strong>Count:</strong> ${count}<br/>
              //     <a href="${hexbinLinkUrl}" class="hexbin-link" data-h3="${h3}">Click to search</a>
              //   </div>`,
              // );
              // layer.on("popupopen", function (e) {
              //   const link = e.popup._contentNode.querySelector(".hexbin-link");
              //   if (link) {
              //     link.addEventListener("click", function (evt) {
              //       evt.preventDefault();
              //       if (typeof hexbinLink === "function") {
              //         const url = hexbinLink(h3);
              //         if (url) {
              //           navigate(url);
              //         }
              //       }
              //     });
              //   }
              // });
              layer.on("click", () => {
                setHexbinPopupMeta({
                  h3,
                  count,
                });
              });
            }}
          />
        )}
        {markers}
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
          fill={hexbinColor(hexbinPopupMeta.count)}
          stroke={"none"}
          oceanColor={oceanColor}
        />
      )}
    </div>
  );
};

export default Map;
