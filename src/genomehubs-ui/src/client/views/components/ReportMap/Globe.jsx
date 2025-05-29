import {
  Color,
  ConeGeometry,
  Group,
  Mesh,
  MeshPhongMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { hex, lab } from "color-convert";
import { useLocation, useNavigate } from "@reach/router";

import GlobeGl from "react-globe.gl";
import NavLink from "../NavLink";
import Skeleton from "@mui/material/Skeleton";
import countriesGeoJson from "../geojson/countries.geojson";
import { findCenterLatLng } from "./functions/mapHelpers";
import getCountryColor from "./functions/getCountryColor";
import getMapOptions from "./functions/getMapOptions";
import hexBinsToGeoJson from "./functions/hexBinsToGeoJson";
import { mixColor } from "../../functions/mixColor";

const Globe = ({
  bounds,
  width,
  height,
  colorScheme,
  geoPoints = [],
  regionField,
  countryCounts,
  theme = "darkTheme",
  palette,
  onCountryClick,

  pointsData = [],
  hexBinCounts = {},
  hexPolygonResolution = 3,
  nightMode = false,
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

  const hexbinMaxCount = useMemo(
    () => Math.max(...Object.values(hexBinCounts), 1),
    [hexBinCounts],
  );

  const {
    globeOptions: {
      baseCountryBg,
      countryOutlineColor,
      globeBg,
      globeBgImg,
      globeImageUrl,
      oceanColor,
      bumpImageUrl,
      countryColor,
      hexbinColor,
    },
  } = getMapOptions({
    theme: "darkTheme",
    colorScheme,
    nightMode,
    showRegions: Boolean(regionField),
    countryOverlayColor,
    hexbinOverlayColor,
    countryMaxCount: maxCount,
    hexbinMaxCount,
  });

  const getPolyColor = useCallback(
    (d) => countryColor(countryCounts[d.properties.ISO_A2]) + "cc",
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
  const getPinProps = ({ pointsData, size = 0.5, elevation = 0.04 }) => {
    const labelsData = pointsData.flatMap((d) => {
      const { lat, lng, label, alt, color, radius, ...rest } = d;
      return [
        {
          lat,
          lng,
          alt: alt || elevation, // default altitude if not provided
          color: color || "#fec44f", // default color if not provided
          label: label || "Point",
          radius: radius || size, // default radius if not provided
          outline: false, // indicate this is a regular point
          ...rest,
        },
        {
          lat,
          lng,
          alt: alt ? alt - 0.002 : elevation - 0.002, // default altitude if not provided
          color: "#ffffff", // default color if not provided
          label: "",
          radius: radius ? radius + size / 2 : size * 1.5, // default radius if not provided
          outline: true,

          ...rest,
        },
      ];
    });

    const pointProps = {
      pointsData: pointsData,
      pointLat: (d) => d.lat,
      pointLng: (d) => d.lng,
      pointAltitude: (d) => d.alt || elevation - 0.001,
      pointRadius: size / 5,
      pointColor: (d) => d.color || "#fec44f",
    };

    const labelProps = {
      labelsData: labelsData,
      labelLat: (d) => d.lat,
      labelLng: (d) => d.lng,
      labelAltitude: (d) => d.alt || elevation,
      labelDotRadius: (d) => d.radius || size, // default radius if not provided
      labelColor: (d) => d.color || "#fec44f",
      labelText: (d) => "_",
      labelSize: 0.0000001,
    };

    return {
      ...pointProps,
      ...labelProps,
    };
  };

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

  const polygonProps = {
    globeMaterial: new MeshPhongMaterial({
      color: oceanColor,
      bumpMap: null,
      bumpScale: 0,
    }),
    polygonsData: countriesGeoJson.features,
    polygonCapColor: getPolyColor,
    polygonStrokeColor: () => countryOutlineColor,
    polygonLabel: getPolyLabel,
    onPolygonClick: handlePolyClick,
    polygonSideColor: () => oceanColor + "80",
    polygonAltitude: (d) =>
      countryCounts[d.properties.ISO_A2] > 0 ? 0.01 : 0.01,
  };

  // Build combined pointsData with outline and center for each point
  const pinProps = getPinProps({ pointsData, size: 0.5, elevation: 0.04 });

  // const labelProps = {
  //   particlesData: labelsData,
  //   particleLat: (d) => d.lat,
  //   particleLng: (d) => d.lng,
  //   particleAltitude: (d) => d.alt || 0.045,
  //   particlesSize: (d) => d.radius || 0.05, // default radius if not provided
  //   particlesColor: (d) => d.color || "#fec44f",
  //   // labelText: (d) => "_",
  // };

  const hexbinProps = {
    hexPolygonsData: hexBinFeatures,
    hexPolygonResolution: hexPolygonResolution,
    hexPolygonMargin: 0.05,
    hexPolygonPoints: (d) => d.geometry.coordinates[0],
    hexPolygonColor: (d) => hexbinColor(d.properties.count) + "cc",
    hexPolygonAltitude: 0.015,
    hexPolygonLabel: (d) =>
      `Hex: ${d.properties.h3}\nCount: ${d.properties.count}`,
  };

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
          globeImageUrl={globeImageUrl}
          bumpImageUrl={bumpImageUrl}
          rendererConfig={{ alpha: true }}
          showGlobe={true}
          globeMaterial={
            globeImageUrl === null
              ? new MeshPhongMaterial({ color: oceanColor })
              : null
          }
          // POLYGONS LAYER
          {...(globeImageUrl ? {} : polygonProps)}
          // HEXBIN LAYER
          {...hexbinProps}
          // POINTS LAYER
          {...(pointsData.length > 0 ? pinProps : {})}
          onGlobeReady={() => setGlobeLoading(false)}
        />
      )}
    </div>
  );
};

export default Globe;
