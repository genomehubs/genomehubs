import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import CountryPopup from "./CountryPopup";
import GlobeGl from "react-globe.gl";
import HexbinPopup from "./HexbinPopup";
import { Color, MeshPhongMaterial, ShaderMaterial, Vector2 } from "three";
import PointPopup from "./PointPopup";
import Skeleton from "@mui/material/Skeleton";
import { findCenterLatLng } from "./functions/mapHelpers";
import getMapOptions from "./functions/getMapOptions";
import hexBinsToGeoJson from "./functions/hexBinsToGeoJson";
import { useLocation } from "@reach/router";
import useNavigate from "#hooks/useNavigate";
import * as solar from "solar-calculator";

// Day/Night shader for ocean color shading
const dayNightShader = {
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    #define PI 3.141592653589793
    uniform vec3 dayColor;
    uniform vec3 nightColor;
    uniform vec2 sunPosition;
    uniform vec2 globeRotation;
    varying vec3 vNormal;

    float toRad(in float a) {
      return a * PI / 180.0;
    }

    vec3 Polar2Cartesian(in vec2 c) { // [lng, lat]
      float theta = toRad(90.0 - c.x);
      float phi = toRad(90.0 - c.y);
      return vec3( // x,y,z
        sin(phi) * cos(theta),
        cos(phi),
        sin(phi) * sin(theta)
      );
    }

    void main() {
      float invLon = toRad(globeRotation.x);
      float invLat = -toRad(globeRotation.y);
      mat3 rotX = mat3(
        1.0, 0.0, 0.0,
        0.0, cos(invLat), -sin(invLat),
        0.0, sin(invLat), cos(invLat)
      );
      mat3 rotY = mat3(
        cos(invLon), 0.0, sin(invLon),
        0.0, 1.0, 0.0,
        -sin(invLon), 0.0, cos(invLon)
      );
      vec3 rotatedSunDirection = rotX * rotY * Polar2Cartesian(sunPosition);
      float intensity = dot(normalize(vNormal), normalize(rotatedSunDirection));
      float blendFactor = smoothstep(-0.1, 0.1, intensity);
      gl_FragColor = vec4(mix(nightColor, dayColor, blendFactor), 1.0);
    }
  `
};

// Calculate sun position at given date/time
const sunPosAt = (dt) => {
  const day = new Date(+dt).setUTCHours(0, 0, 0, 0);
  const t = solar.century(dt);
  const longitude = (dt - day) / 864e5 * 360 - 180;
  return [longitude - solar.equationOfTime(t) / 4, solar.declination(t)];
};

const Globe = ({
  bounds,
  width,
  height,
  colorScheme,
  geoPoints = [],
  dataBounds,
  regionField,
  countryCounts,
  theme = "darkTheme",
  palette,
  onCountryClick,
  regionLink = () => {},
  hexbinLink = () => {},
  pointLink = () => {},
  pointsData = [],
  hexBinCounts = {},
  hexPolygonResolution = 3,
  nightMode = false,
  countryOverlayColor = "#fec44f",
  hexbinOverlayColor = "#3182bd",
  reportSelect = "bin",
}) => {
  // Overlay colors (match ReportMap)
  const location = useLocation();
  const globeRef = useRef();
  const mapContainerRef = useRef(); // always call useRef, unconditionally
  const materialAppliedRef = useRef(false); // Track if shader material has been applied
  const [globeLoading, setGlobeLoading] = useState(true); // <-- ensure this is defined in Map
  const [showGlobe, setShowGlobe] = useState(false); // <-- move this up to top-level, before any conditional logic
  const [countriesGeoJson, setCountriesGeoJson] = useState(null);
  const [dt, setDt] = useState(+new Date()); // Track current date/time for sun position
  const [globeMaterial, setGlobeMaterial] = useState(); // Day/night shader material
  const globeRotationRef = useRef(new Vector2()); // Use ref instead of state to avoid re-renders

  useEffect(() => {
    // Only load geojson if regionField is set (showing country overlays)
    if (regionField) {
      import("../geojson/countries-full.geojson").then((module) => {
        setCountriesGeoJson(module.default);
      });
    } else {
      setCountriesGeoJson(null);
    }
  }, [regionField]);

  // Create day/night shader material with color uniforms
  useEffect(() => {
    const material = new ShaderMaterial({
      uniforms: {
        dayColor: { value: new Color(0x87ceeb) }, // Sky blue for day
        nightColor: { value: new Color(0x1a1a2e) }, // Dark blue for night
        sunPosition: { value: new Vector2() },
        globeRotation: { value: new Vector2() },
      },
      vertexShader: dayNightShader.vertexShader,
      fragmentShader: dayNightShader.fragmentShader,
      transparent: false,
      wireframe: false,
      side: 2, // FrontSide
    });
    setGlobeMaterial(material);
  }, []);

  // Update time at regular intervals for dynamic sun position
  useEffect(() => {
    const interval = setInterval(() => {
      setDt((+new Date()));
    }, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  // Update sun position in shader based on current time
  useEffect(() => {
    if (globeMaterial) {
      const [sunLng, sunLat] = sunPosAt(dt);
      globeMaterial.uniforms.sunPosition.value.set(sunLng, sunLat);
    }
  }, [dt, globeMaterial]);

  // Apply shader material to globe mesh once it's loaded
  useEffect(() => {
    if (globeMaterial && globeRef.current && !materialAppliedRef.current) {
      const scene = globeRef.current.scene();
      let maxVertices = 0;
      let globeMesh = null;
      
      scene.traverse((obj) => {
        // Find the globe mesh - highest vertex count with scale exactly 1
        if (obj.isMesh && obj.name === "" && obj.scale.x === 1 && obj.scale.y === 1 && obj.scale.z === 1) {
          const vertexCount = obj.geometry ? obj.geometry.attributes.position.count : 0;
          if (vertexCount > maxVertices) {
            maxVertices = vertexCount;
            globeMesh = obj;
          }
        }
      });
      
      if (globeMesh) {
        console.log("Applying shader to globe mesh with", maxVertices, "vertices");
        globeMesh.material = globeMaterial;
        materialAppliedRef.current = true;
      }
    }
  }, [globeMaterial]);

  // Update globe rotation in shader when camera moves
  const handleZoom = useCallback(
    ({ lng, lat }) => {
      // Update material uniforms directly without triggering re-renders
      if (globeMaterial && globeMaterial.uniforms && globeMaterial.uniforms.globeRotation) {
        globeMaterial.uniforms.globeRotation.value.set(lng, lat);
      }
    },
    [globeMaterial]
  );

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
      lightColor,
      darkColor,
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

  const hexbinStyle = (count) => {
    if (!pointsData || pointsData.length == 0) {
      return {
        fillColor: hexbinColor(count),
        color: "none",
        fillOpacity: 0.8,
      };
    }
    return {
      fillColor: "#eeeeee",
      color: "none",
      fillOpacity: 0.1,
    };
  };

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
  // Show popup on country click
  const [countryPopupMeta, setCountryPopupMeta] = useState(null);
  const [hexbinPopupMeta, setHexbinPopupMeta] = useState(null);
  const [pointPopupMeta, setPointPopupMeta] = useState(null);
  const navigate = useNavigate();

  const handlePolyClick = useCallback(
    (d, event) => {
      setHexbinPopupMeta(null);
      setPointPopupMeta(null);
      setCountryPopupMeta({
        iso: d.properties.ISO_A2,
        name: d.properties.ADMIN,
        count: countryCounts[d.properties.ISO_A2] || 0,
        coordinates: d.geometry.coordinates,
        lat: event?.lat || d.properties.LAT || 0,
        lng: event?.lng || d.properties.LON || 0,
      });
    },
    [onCountryClick, countryCounts],
  );

  const handleHexbinClick = useCallback(
    (d, event) => {
      setCountryPopupMeta(null);
      setPointPopupMeta(null);
      setHexbinPopupMeta({
        h3: d.properties.h3,
        count: d.properties.count,
        style: hexbinStyle(d.properties.count),
        lat: event?.lat || d.properties.LAT || 0,
        lng: event?.lng || d.properties.LON || 0,
      });
    },
    [hexbinLink, navigate],
  );

  const handlePointClick = useCallback(
    (d, event) => {
      setCountryPopupMeta(null);
      setHexbinPopupMeta(null);
      setPointPopupMeta({
        color: d.color || "#fec44f",
        radius: d.radius || 0.5,
        fillColor: d.catColor || "#fec44f",
        ...d,
      });
    },
    [pointLink, navigate],
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
          catColor: color || "#fec44f",
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
          catColor: color || "#fec44f",
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
      pointsTransitionDuration: 0,
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
      onLabelClick: handlePointClick,
      labelsTransitionDuration: 0,
    };

    return {
      ...pointProps,
      ...labelProps,
    };
  };

  // HEXBIN LAYER SETUP
  let hexBinFeatures = [];
  if (
    hexBinCounts &&
    Object.keys(hexBinCounts).length > 0 &&
    reportSelect !== "point"
  ) {
    hexBinFeatures = hexBinsToGeoJson(
      hexBinCounts,
      reportSelect == "bin" && pointsData.length > 0,
    ).features;
  }

  // NEW: Delay mounting Globe so spinner/background are painted first
  useEffect(() => {
    setShowGlobe(false);
    const t = setTimeout(() => setShowGlobe(true), 30); // 30ms delay
    return () => clearTimeout(t);
  }, []);

  // Ensure globe zooms to bounds when showGlobe becomes true
  useEffect(() => {
    if (showGlobe && globeRef.current) {
      // Helper to compute center and altitude for a bounding box
      const computeView = (
        minLat,
        minLon,
        maxLat,
        maxLon,
        altitudeOffset = 0,
      ) => {
        const centerLat = (minLat + maxLat) / 2;
        const centerLon = (minLon + maxLon) / 2;
        const latSpread = maxLat - minLat;
        const lngSpread = maxLon - minLon;
        const spread = Math.max(latSpread, lngSpread);
        const globeWidth = 360;
        const minAltitude = 0.5;
        const maxAltitude = 2.5;
        const altitude = Math.min(
          Math.max((spread / globeWidth) * 1.5 + altitudeOffset, minAltitude),
          maxAltitude,
        );
        return { lat: centerLat, lng: centerLon, altitude };
      };

      let pov = { lat: centerLat, lng: centerLon, altitude: 1.5 };

      if (dataBounds && dataBounds.length === 4) {
        const [minLat, minLon, maxLat, maxLon] = dataBounds;
        pov = computeView(minLat, minLon, maxLat, maxLon, 0);
      }
      if (pointsData && pointsData.length > 0) {
        const lats = pointsData.map((p) => p.lat);
        const lngs = pointsData.map((p) => p.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        pov = computeView(minLat, minLng, maxLat, maxLng, 0.8);
      }

      globeRef.current.pointOfView(pov, 1000);
    }
  }, [showGlobe, centerLat, centerLon, pointsData]);

  if (width === 0) {
    return null;
  }

  // Only show loading if regionField is set but geojson not loaded yet
  if (regionField && !countriesGeoJson) {
    return (
      <div
        style={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>Loading map data...</div>
      </div>
    );
  }

  const polygonProps = {
    globeMaterial: globeMaterial || new MeshPhongMaterial({
      color: oceanColor,
      bumpMap: null,
      bumpScale: 0,
    }),
    ...(countriesGeoJson && {
      polygonsData: countriesGeoJson.features,
      polygonCapColor: getPolyColor,
      polygonStrokeColor: () => countryOutlineColor,
      polygonLabel: getPolyLabel,
      onPolygonClick: handlePolyClick,
      polygonSideColor: () => oceanColor + "40",
      polygonAltitude: (d) =>
        countryCounts[d.properties.ISO_A2] > 0 ? 0.01 : 0.01,
      polygonsTransitionDuration: 0,
    }),
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
    hexPolygonColor: (d) => {
      if (d.properties.duplicate) {
        return "transparent";
      }
      const style = hexbinStyle(d.properties.count);
      // Convert alpha (0-1) to 2-digit hex
      const hexOpacity = Math.round(style.fillOpacity * 255)
        .toString(16)
        .padStart(2, "0");
      return `${style.fillColor}${hexOpacity}`;
    },
    hexPolygonAltitude: (d) => (d.properties.duplicate ? 0.045 : 0.015),
    hexPolygonLabel: (d) =>
      `H3: ${d.properties.h3}<br />Count: ${d.properties.count}`,
    onHexPolygonClick: handleHexbinClick,
    hexPolygonsTransitionDuration: 0,
  };

  return (
    <div
      style={{
        width,
        height,
        background: globeBg,
        // marginTop: "1em",
        position: "relative",

        borderRadius: "32px",
        overflow: "hidden",
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
          <Skeleton
            variant="circular"
            width={Math.max(Math.min(width, height) * 0.75, 200)}
            height={Math.max(Math.min(width, height) * 0.75, 200)}
            animation="wave"
            sx={{ bgcolor: nightMode ? "#444" : "#f3f3f3" }}
          />
        </div>
      )}

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
          directionalLightPosition={[1, 0, 0]}
          ambientLightIntensity={0.5}
          directionalLightColor={lightColor}
          ambientLightColor={darkColor}
          showGlobe={true}
          cameraPositionRadius={globeMaterial ? 2.5 : undefined}
          // POLYGONS LAYER - show when geojson is loaded
          {...(countriesGeoJson ? polygonProps : {})}
          // HEXBIN LAYER
          {...hexbinProps}
          // POINTS LAYER
          {...(pointsData.length > 0 ? pinProps : {})}
          onGlobeReady={() => {
            setGlobeLoading(false);
          }}
          {...(globeMaterial ? { onZoom: handleZoom } : {})}
        />
      )}
      {/* Zoom controls */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          gap: "0.1em",
        }}
      >
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: "12px 12px 0 0",
            border: "none",
            background: "#fff",
            color: "#333",
            fontSize: "1.5em",
            cursor: "pointer",
            marginBottom: 0,
          }}
          aria-label="Zoom in"
          onClick={() => {
            if (globeRef.current) {
              const pov = globeRef.current.pointOfView();
              globeRef.current.pointOfView(
                { ...pov, altitude: Math.max(0.3, pov.altitude * 0.8) },
                500,
              );
            }
          }}
        >
          +
        </button>
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: "0 0 12px 12px",
            border: "none",
            background: "#fff",
            color: "#333",
            fontSize: "1.5em",
            cursor: "pointer",
          }}
          aria-label="Zoom out"
          onClick={() => {
            if (globeRef.current) {
              const pov = globeRef.current.pointOfView();
              globeRef.current.pointOfView(
                { ...pov, altitude: Math.min(5, pov.altitude * 1.25) },
                500,
              );
            }
          }}
        >
          –
        </button>
      </div>
      {/* Show popup if defined */}
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
      {/* Close button */}
    </div>
  );
};

export default Globe;
