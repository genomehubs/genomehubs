import "leaflet/dist/leaflet.css";

import {
  CircleMarker,
  MapContainer,
  Pane,
  Popup,
  TileLayer,
} from "react-leaflet";
import React, { useEffect } from "react";
import { globalHistory, useLocation } from "@reach/router";

import LocationMapHighlightIcon from "./LocationMapHighlightIcon";
import NavLink from "./NavLink";
import ZoomComponent from "./ZoomComponent";
import { compose } from "recompose";
import dispatchGeography from "../hocs/dispatchGeography";
import qs from "../functions/qs";
import withSiteName from "#hocs/withSiteName";

const SingleMarker = ({ position, children, setHighlightPointLocation }) => {
  return (
    <CircleMarker
      eventHandlers={{
        mouseover: (e) => setHighlightPointLocation(position.join(",")),
        mouseout: (e) => setHighlightPointLocation(""),
      }}
      center={position}
      color={"#fec44f"}
    >
      {children}
    </CircleMarker>
  );
};

const MarkerComponent = ({
  geoPoints,
  meta,
  options,
  taxonId,
  setHighlightPointLocation,
  basename,
}) => {
  let positions = [];
  let bounds = [
    [90, 180],
    [-90, -180],
  ];

  for (let coords of geoPoints) {
    let arr = coords.split(",");
    positions.push(arr);
    bounds[0][0] = Math.min(bounds[0][0], arr[0]);
    bounds[0][1] = Math.min(bounds[0][1], arr[1]);
    bounds[1][0] = Math.max(bounds[1][0], arr[0]);
    bounds[1][1] = Math.max(bounds[1][1], arr[1]);
  }
  bounds[0][0] -= 0.5;
  bounds[0][1] -= 0.5;
  bounds[1][0] += 0.5;
  bounds[1][1] += 0.5;
  let markers = positions.map((position, i) => {
    // TODO: add lookup to link pins to samples
    let message = (
      <>
        This feature is in development. <br /> Pins will be linked to full
        sample information.
      </>
    );
    if (meta.values && meta.values.length == positions.length) {
      let link = (
        <NavLink
          url={`${basename}/record?recordId=${meta.values[i].source_id}&result=${meta.values[i].source_index}&taxonomy=${options.taxonomy}`}
        >
          {meta.values[i].source_id}
        </NavLink>
      );
      message = (
        <>
          click to view full record for {meta.values[i].source_index}: {link}
        </>
      );
    } else if (taxonId) {
      let newOptions = {};
      // if (options.recordId) {
      newOptions = {
        query: `tax_tree(${taxonId}) AND sample_location=${position.join(",")}`,
        result: "sample",
        taxonomy: options.taxonomy,
      };

      let url = `${basename}/search?${qs.stringify(newOptions)}`;
      let link = (
        <NavLink url={url}>click to view samples from this location</NavLink>
      );
      message = link;
    }
    return (
      <SingleMarker
        key={i}
        position={position}
        setHighlightPointLocation={setHighlightPointLocation}
      >
        <Popup>{message}</Popup>
      </SingleMarker>
    );
  });
  return { markers, bounds };
};

const LocationMap = ({
  geoPoints = [],
  zoom = 10,
  meta = {},
  taxonId,
  setHighlightPointLocation,
  setZoomPointLocation,
  basename,
}) => {
  const location = useLocation();
  let threshold = 500;
  if (geoPoints.length > threshold) {
    // TODO: bin samples when a large number of points are returned
    return null;
  }
  useEffect(() => {
    return globalHistory.listen(({ action, location }) => {
      if (action === "PUSH" || action === "POP") {
        setZoomPointLocation(false);
        setHighlightPointLocation(false);
      }
    });
  }, []);
  let options = qs.parse(location.search.replace(/^\?/, ""));
  let { markers, bounds } = MarkerComponent({
    geoPoints,
    meta,
    options,
    taxonId,
    setHighlightPointLocation,
    basename,
  });

  return (
    <MapContainer
      bounds={bounds}
      scrollWheelZoom={false}
      tap={false}
      style={{
        marginTop: "1em",
        width: "800",
        height: "450px",
        background: "none",
      }}
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
      />
      {markers}
      <Pane name={"highlightPane"} style={{ zIndex: 999 }}>
        <LocationMapHighlightIcon />
      </Pane>
      <ZoomComponent fullBounds={bounds} />
    </MapContainer>
  );
};

export default compose(withSiteName, dispatchGeography)(LocationMap);
