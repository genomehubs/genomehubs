import "leaflet/dist/leaflet.css";

import {
  CircleMarker,
  LayerGroup,
  LayersControl,
  MapContainer,
  Marker,
  Pane,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import Leaflet, { FeatureGroup } from "leaflet";
import React, { useEffect, useRef, useState } from "react";

import LocationMapHighlightIcon from "./LocationMapHighlightIcon";
import MarkerIcon from "leaflet/dist/images/marker-icon.png";
import MarkerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
import MarkerShadow from "leaflet/dist/images/marker-shadow.png";
import NavLink from "./NavLink";
import PersonPinCircleTwoToneIcon from "@material-ui/icons/PersonPinCircleTwoTone";
import ZoomComponent from "./ZoomComponent";
import { compose } from "recompose";
import dispatchGeography from "../hocs/dispatchGeography";
import qs from "qs";
import { renderToStaticMarkup } from "react-dom/server";
import { useLocation } from "@reach/router";

const generateCustomMarkerIcon = ({ scale }) =>
  Leaflet.icon({
    iconUrl: MarkerIcon,
    iconRetinaUrl: MarkerIconRetina,
    shadowUrl: MarkerShadow,

    iconSize: [5 * scale, 8 * scale + 1], // size of the icon
    shadowSize: [8 * scale + 1, 8 * scale + 1], // size of the shadow
    iconAnchor: [Math.floor(2.5 * scale), 8 * scale], // point of the icon which will correspond to marker's location
    shadowAnchor: [Math.floor(2.5 * scale), 8 * scale], // the same for the shadow
    popupAnchor: [0, -8 * scale], // point from which the popup should open relative to the iconAnchor
  });

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
  customMarkerIcon,
  setHighlightPointLocation,
}) => {
  // const [markers, setMarkers] = useState(null);
  // const map = useMap();
  let positions = [];
  let bounds = [
    [90, 180],
    [-90, -180],
  ];

  // useEffect(() => {
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
          url={`/record?recordId=${meta.values[i].source_id}&result=${meta.values[i].source_index}&taxonomy=${options.taxonomy}`}
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

      let url = `/search?${qs.stringify(newOptions)}`;
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
      // <Marker key={i} icon={customMarkerIcon} position={position}>
      //   <Popup>{message}</Popup>
      // </Marker>
    );
  });
  //   );
  //   if (map) {
  //     map.fitBounds(fullBounds);
  //   }
  // }, []);
  return { markers, bounds };
};

const LocationMap = ({
  geoPoints = [],
  zoom = 10,
  meta = {},
  taxonId,
  setHighlightPointLocation,
}) => {
  const location = useLocation();
  let threshold = 500;
  if (geoPoints.length > threshold) {
    // TODO: bin samples when a large number of points are returned
    return null;
  }
  let scale = 4;
  const customMarkerIcon = generateCustomMarkerIcon({ scale });
  const customHighlightIcon = generateCustomMarkerIcon({ scale: 6 });
  let options = qs.parse(location.search.replace(/^\?/, ""));
  let { markers, bounds } = MarkerComponent({
    geoPoints,
    meta,
    options,
    taxonId,
    setHighlightPointLocation,
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
        //url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        //attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        // choose layers from https://leaflet-extras.github.io/leaflet-providers/preview/
        // url="https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}"
        // attribution='Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        // subdomains="abcd"
        // minZoom={1}
        // maxZoom={16}
        // ext="jpg"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
      />
      {markers}
      <Pane name={"highlightPane"} style={{ zIndex: 999 }}>
        <LocationMapHighlightIcon customHighlightIcon={customHighlightIcon} />
      </Pane>
      <ZoomComponent fullBounds={bounds} />
    </MapContainer>
  );
};

export default compose(dispatchGeography)(LocationMap);
