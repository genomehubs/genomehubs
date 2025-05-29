export const getMapOptions = ({
  theme,
  colorScheme,
  nightMode,
  mapProjection,
  showRegions,
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
      // Use CartoDB's dark matter tiles for mercator, and OpenStreetMap for cylindricalEqualArea in night mode:
      // if (mapProjection === "mercator") {
      //   tileUrl =
      //     "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
      //   tileAttribution =
      //     '© <a href="https://carto.com/attributions">CARTO</a> | Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
      // }
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

  let globeOptions = {
    baseCountryBg,
    countryOutlineColor,
    darkColor,
    globeBg,
    globeBgImg,
    globeImageUrl,
    lightColor,
    oceanColor,
  };

  let mapOptions = {
    baseCountryBg,
    countryOutlineColor,
    countryOutlineGlow,
    tileAttribution,
    tileUrl,
    oceanColor,
  };

  return { globeOptions, mapOptions };
};

export default getMapOptions;
