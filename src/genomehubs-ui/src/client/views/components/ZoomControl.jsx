import { compose } from "redux";
import withGeography from "#hocs/withGeography";
import withStableGeography from "#hocs/withStableGeography";

const ZoomControl = ({
  setHighlightPointLocation,
  value,
  zoomPointLocation,
  setZoomPointLocation,
  children,
}) => {
  return (
    <span
      style={{ cursor: "pointer" }}
      onPointerEnter={() => {
        setHighlightPointLocation(value);
      }}
      onPointerLeave={() => {
        setHighlightPointLocation("");
      }}
      onClick={() => {
        if (zoomPointLocation && zoomPointLocation == value) {
          setZoomPointLocation(false);
        } else {
          setZoomPointLocation(value);
        }
      }}
    >
      {children}
    </span>
  );
};

export default compose(withGeography, withStableGeography)(ZoomControl);
