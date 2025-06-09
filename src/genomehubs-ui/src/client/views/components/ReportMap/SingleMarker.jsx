import { CircleMarker } from "react-leaflet";
import React from "react";

const SingleMarker = ({
  position,
  color = "#fec44f",
  children,
  setHighlightPointLocation = () => {},
  interactive = true,
}) => {
  console.log(interactive);
  return (
    <CircleMarker
      eventHandlers={
        interactive
          ? {
              mouseover: (e) => setHighlightPointLocation(position.join(",")),
              mouseout: (e) => setHighlightPointLocation(""),
            }
          : {}
      }
      center={position}
      color={"white"}
      stroke={1}
      fillColor={color}
      fillOpacity={1}
    >
      {children}
    </CircleMarker>
  );
};

const MarkerComponent = ({
  geoPoints = [],
  color,
  meta,
  options,
  taxonId,
  setHighlightPointLocation = () => {},
  basename,
}) => {
  let markers = [];
  let i = 0;
  for (let obj of geoPoints) {
    let { coords } = obj;
    if (!Array.isArray(coords)) {
      coords = [coords];
    }
    for (let latLon of coords) {
      let arr = latLon.split(",");
      let message = obj.scientific_name ? `${obj.scientific_name} - ` : "";
      let link;
      if (obj.sampleId) {
        link = (
          <NavLink
            url={`${basename || ""}/record?recordId=${
              obj.sampleId
            }&result=sample&taxonomy=${options.taxonomy}`}
          >
            {obj.sampleId}
          </NavLink>
        );
      } else if (obj.taxonId) {
        let newOptions = {};
        // if (options.recordId) {
        newOptions = {
          query: `tax_tree(${obj.taxonId}) AND sample_location=${latLon}`,
          result: "sample",
          taxonomy: options.taxonomy,
        };

        let url = `${basename || ""}/search?${qs.stringify(newOptions)}`;
        link = (
          <NavLink url={url}>click to view samples from this location</NavLink>
        );
      }
      // TODO: handle assemblyId
      message = (
        <>
          {message} {link}
        </>
      );
      markers.push(
        <SingleMarker
          key={i}
          position={arr}
          color={color}
          setHighlightPointLocation={setHighlightPointLocation}
        >
          <Popup>{message}</Popup>
        </SingleMarker>,
      );
      i++;
    }
  }

  return markers;
};

export default SingleMarker;
