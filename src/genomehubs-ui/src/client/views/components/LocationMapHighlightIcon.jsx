import "leaflet/dist/leaflet.css";

import { CircleMarker, LayerGroup, Marker } from "react-leaflet";
import React, { useEffect, useRef, useState } from "react";

import { compose } from "recompose";
import withGeography from "../hocs/withGeography";

const LocationMapHighlightIcon = ({
  customHighlightIcon,
  highlightPointLocation,
}) => {
  const [position, setPosition] = useState([]);
  const layerRef = useRef(null);
  useEffect(() => {
    if (highlightPointLocation) {
      let coords = highlightPointLocation.replaceAll("−", "-").split(",");
      setPosition(coords);
    } else {
      setPosition([]);
    }
  }, [highlightPointLocation]);
  let marker;
  if (position.length == 2) {
    marker = <Marker icon={customHighlightIcon} position={position}></Marker>;
    marker = (
      <CircleMarker
        center={position}
        color={"#993404"}
        fillOpacity={0.5}
        interactive={false}
      />
    );
  }
  return <LayerGroup ref={layerRef}>{marker}</LayerGroup>;
};

export default compose(withGeography)(LocationMapHighlightIcon);
