import CountrySVG from "./CountrySVG";
import ReportPopup from "./ReportPopup";

export const CountryPopup = ({
  theme,
  nightMode,
  setCountryPopup,
  countryPopupMeta,
  regionLink,
  navigate,
  oceanColor,
  countryColor,
  countryOutlineColor,
}) => {
  return (
    <ReportPopup
      theme={theme}
      position="bottom-left"
      nightMode={nightMode}
      onClose={() => setCountryPopup(null)}
      title={`${countryPopupMeta.name} (${countryPopupMeta.iso})`}
      detail={`Count: ${countryPopupMeta.count}`}
      link={regionLink(countryPopupMeta.iso)}
      handleLinkClick={() => navigate(regionLink(countryPopupMeta.iso))}
      children={
        <div
          style={{
            height: "10em",
            width: "100%",
            position: "relative",
            background: oceanColor,
            borderRadius: 8,
            overflow: "hidden",
            margin: "0.5em 0",
          }}
        >
          <CountrySVG
            coordinates={countryPopupMeta.coordinates}
            fill={countryColor(countryPopupMeta.count)}
            stroke={countryOutlineColor}
          />
        </div>
      }
    />
  );
};

export default CountryPopup;
