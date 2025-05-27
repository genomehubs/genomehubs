import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "@reach/router";

import GlobeGl from "react-globe.gl";
import { MeshPhongMaterial } from "three";
import NavLink from "../NavLink";
import Skeleton from "@mui/material/Skeleton";
import countriesGeoJson from "../geojson/countries.geojson";
import { findCenterLatLng } from "./functions/mapHelpers";
import getCountryColor from "./functions/getCountryColor";
import hexBinsToGeoJson from "./functions/hexBinsToGeoJson";
import { mixColor } from "../../functions/mixColor";

const Globe = ({
  bounds,
  markers,
  width,
  height,
  geoPoints = [],
  countryCounts,
  palette,
  onCountryClick,
  oceanColor = "#b3d1e6",
  baseCountryBg = "#eeeeee",
  globeBg = "#eeeeee",
  globeBgImg = null,
  pointsData = [],
  hexBinCounts = {},
  nightMode = false,
  countryOutlineColor = "#333333",
  countryOverlayColor = "#fec44f",
  hexbinOverlayColor = "#3182bd",
}) => {
  // Overlay colors (match ReportMap)
  const location = useLocation();
  const globeRef = useRef();
  const mapContainerRef = useRef(); // always call useRef, unconditionally
  const [globeLoading, setGlobeLoading] = useState(true); // <-- ensure this is defined in Map
  const [showGlobe, setShowGlobe] = useState(false); // <-- move this up to top-level, before any conditional logic
  // Calculate center of bounds for zoom
  const [centerLat, centerLon] = findCenterLatLng(bounds);

  const maxCount = useMemo(
    () => Math.max(...Object.values(countryCounts), 1),
    [countryCounts],
  );
  const getPolyColor = useCallback(
    (d) =>
      getCountryColor(
        countryCounts[d.properties.ISO_A2],
        maxCount,
        countryOverlayColor || countryOverlayColorDefault, // use variable
        baseCountryBg,
      ),
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
  //   // Imperatively update Leaflet container background on color change
  //   useEffect(() => {
  //     if (!globeView && mapContainerRef.current) {
  //       // Always query for .leaflet-container inside the wrapper div
  //       const leaflet =
  //         mapContainerRef.current.querySelector(".leaflet-container");
  //       if (leaflet) {
  //         leaflet.style.background = oceanColor;
  //       }
  //     }
  //   }, [oceanColor, globeView, nightMode]);

  // HEXBIN LAYER SETUP
  let hexBinFeatures = [];
  if (hexBinCounts && Object.keys(hexBinCounts).length > 0) {
    hexBinFeatures = hexBinsToGeoJson(hexBinCounts).features;
  }

  const maxBinCount = Math.max(
    ...hexBinFeatures.map((f) => f.properties.count),
    1,
  );

  // NEW: Delay mounting Globe so spinner/background are painted first
  useEffect(() => {
    setShowGlobe(false);
    const t = setTimeout(() => setShowGlobe(true), 30); // 30ms delay
    return () => clearTimeout(t);
  }, []);

  console.log({ centerLat, centerLon, bounds, pointsData });

  // Ensure globe zooms to bounds when showGlobe becomes true
  useEffect(() => {
    if (showGlobe && globeRef.current) {
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
  }, [showGlobe, centerLat, centerLon, pointsData]);

  if (width === 0) {
    return null;
  }

  // Build combined pointsData with outline and center for each point
  const combinedPointsData = [];
  for (const pt of pointsData) {
    combinedPointsData.push({ ...pt, isOutline: true }); // white outline
    combinedPointsData.push({ ...pt, isOutline: false, label: pt.label }); // colored center with label
  }

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
            background: globeBg,
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
        <GlobeGl
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
          hexPolygonResolution={3}
          hexPolygonMargin={0.05}
          hexPolygonPoints={(d) => d.geometry.coordinates[0]}
          hexPolygonColor={(d) =>
            mixColor({
              color1: hexbinOverlayColor,
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
};

export default Globe;
