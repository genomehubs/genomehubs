import "leaflet/dist/leaflet.css";

import Leaflet, { FeatureGroup, divIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import React, { useEffect, useRef, useState } from "react";

import MarkerIcon from "leaflet/dist/images/marker-icon.png";
import MarkerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
import MarkerShadow from "leaflet/dist/images/marker-shadow.png";
import NavLink from "./NavLink";
import PersonPinCircleTwoToneIcon from "@material-ui/icons/PersonPinCircleTwoTone";
import qs from "qs";
import { renderToStaticMarkup } from "react-dom/server";
import { useLocation } from "@reach/router";

let customMarkerIcon = Leaflet.icon({
  iconUrl: MarkerIcon,
  iconRetinaUrl: MarkerIconRetina,
  shadowUrl: MarkerShadow,

  iconSize: [25, 41], // size of the icon
  shadowSize: [41, 41], // size of the shadow
  iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
  shadowAnchor: [12, 40], // the same for the shadow
  popupAnchor: [0, -40], // point from which the popup should open relative to the iconAnchor
});
// const iconMarkup = renderToStaticMarkup(
//   <PersonPinCircleTwoToneIcon color={"primary"} fontSize="large" />
// );
// const customMarkerIcon = divIcon({
//   html: iconMarkup,
// });

const LocationMap = ({ geoPoints = [], zoom = 10, meta = {} }) => {
  const location = useLocation();
  let threshold = 500;
  if (geoPoints.length > threshold) {
    // TODO: bin samples when a large number of points are returned
    return null;
  }
  let options = qs.parse(location.search.replace(/^\?/, ""));
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

  const markers = positions.map((position, i) => {
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
    }
    return (
      <Marker key={i} icon={customMarkerIcon} position={position}>
        <Popup>{message}</Popup>
      </Marker>
    );
  });

  return (
    <MapContainer
      bounds={bounds}
      scrollWheelZoom={false}
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
    </MapContainer>
  );
};

export default LocationMap;
