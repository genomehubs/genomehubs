import { mixColor } from "../../../functions/mixColor.js";

export const colorMixer = ({ color1, color2, count = 0, maxCount }) => {
  return mixColor({
    color1,
    color2,
    ratio: Math.min(1, count / maxCount),
  });
};

export const getMapOptions = ({
  theme,
  colorScheme,
  nightMode,
  mapProjection,
  showRegions,
  countryOverlayColor,
  hexbinOverlayColor,
  hexbinMaxCount = 1000,
  countryMaxCount = 1000,
}) => {
  const darkColor = colorScheme?.[theme]?.darkColor || "#222a38";
  const lightColor = colorScheme?.[theme]?.lightColor || "#fff";
  const paleColor = "#eeeeee";
  const countryOutlineColor = nightMode ? "#ffa870" : "#333";
  const countryOutlineGlow = nightMode;
  const oceanColor = nightMode ? "#0a1a2a" : "#b3d1e6";
  let globeBg = null;
  let globeBgImg = null;
  let globeImageUrl = null;
  let baseCountryBg = null;
  let tileUrl = null;
  let tileAttribution;
  if (nightMode) {
    globeBg = "#0a0a1a";
    globeBgImg =
      "https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png";
    baseCountryBg = "#22262a";
    if (!showRegions) {
      globeImageUrl =
        "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg";
      if (mapProjection === "mercator") {
        tileUrl =
          "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png";
        tileAttribution =
          'Imagery provided by NASA Earth Observations (Black Marble, 2016) via <a href="https://earthdata.nasa.gov/gibs">GIBS</a>.';
      }
    }
  } else {
    globeBg = theme === "darkTheme" ? lightColor : darkColor;
    baseCountryBg = theme === "darkTheme" ? darkColor : paleColor;
    if (!showRegions) {
      globeImageUrl =
        "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-day.jpg";
      if (mapProjection === "mercator") {
        tileUrl =
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
        tileAttribution =
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community";
      }
    }
  }

  const hexbinColor = (count) => {
    return colorMixer({
      color1: hexbinOverlayColor || "#fec44f",
      color2: baseCountryBg !== null ? baseCountryBg : paleColor,
      count,
      maxCount: hexbinMaxCount,
    });
  };

  const countryColor = (count) => {
    console.log({
      color1: countryOverlayColor || "#fec44f",
      color2: baseCountryBg !== null ? baseCountryBg : paleColor,
      count,
      maxCount: countryMaxCount,
    });
    return colorMixer({
      color1: countryOverlayColor || "#fec44f",
      color2: baseCountryBg !== null ? baseCountryBg : paleColor,
      count,
      maxCount: countryMaxCount,
    });
  };

  let globeOptions = {
    baseCountryBg,
    countryOutlineColor,
    darkColor,
    globeBg,
    globeBgImg,
    globeImageUrl,
    lightColor,
    darkColor,
    oceanColor,
    hexbinColor,
    countryColor,
  };

  let mapOptions = {
    baseCountryBg,
    countryOutlineColor,
    countryOutlineGlow,
    tileAttribution,
    tileUrl,
    lightColor,
    darkColor,
    oceanColor,
    hexbinColor,
    countryColor,
  };

  return { globeOptions, mapOptions };
};

export default getMapOptions;
