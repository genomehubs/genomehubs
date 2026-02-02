import { compose } from "redux";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import withStableGeography from "#hocs/withStableGeography";

const ZoomComponent = ({ fullBounds, zoomPointLocation }) => {
  const map = useMap();

  useEffect(() => {
    let newBounds;
    if (zoomPointLocation) {
      let arr = zoomPointLocation.replaceAll("−", "-").split(",");
      newBounds = [
        [arr[0] - 0.5, arr[1] - 0.5],
        [1 * arr[0] + 0.5, 1 * arr[1] + 0.5],
      ];
    } else {
      newBounds = fullBounds;
    }

    if (map) {
      map.fitBounds(newBounds);
    }
  }, [zoomPointLocation]);
  return null;
};

export default compose(withStableGeography)(ZoomComponent);
