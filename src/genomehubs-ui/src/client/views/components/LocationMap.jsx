import React from "react";
import { divIcon } from "leaflet";
import { Map, Marker, Popup, TileLayer } from "react-leaflet";

const LocationMap = ({ geoPoints = [], zoom = 10 }) => {
  const positions = geoPoints.map((coords) => coords.split(","));
  const markers = positions.map((position, i) => {
    return <Marker key={i} position={position}></Marker>;
  });

  return (
    <Map
      center={positions[0]}
      zoom={zoom}
      style={{
        marginTop: "1em",
        width: "800",
        height: "450px",
        background: "none",
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />
      {markers}
    </Map>
  );
};

export default LocationMap;
