import NavLink from "../NavLink";
import { Popup } from "react-leaflet";
import React from "react";
import SingleMarker from "./SingleMarker";
import qs from "../../functions/qs";

export default function MarkerComponent({
  geoPoints = [],
  color,
  meta,
  options,
  taxonId,
  setHighlightPointLocation = () => {},
  basename,
  globeView = false,
}) {
  let points = [];
  let i = 0;
  for (const obj of geoPoints) {
    const { coords: rawCoords } = obj;
    const coords = Array.isArray(rawCoords) ? rawCoords : [rawCoords];
    for (const latLon of coords) {
      if (!latLon) {
        continue;
      }
      const arr = latLon.split(",");
      if (arr.length !== 2) {
        continue;
      }
      const lat = parseFloat(arr[0]);
      const lng = parseFloat(arr[1]);
      if (isNaN(lat) || isNaN(lng)) {
        continue;
      }

      let message = obj.scientific_name ? `${obj.scientific_name} - ` : "";
      let link;

      if (globeView) {
        if (obj.sampleId) {
          link = `${basename || ""}/record?recordId=${obj.sampleId}&result=sample&taxonomy=${options.taxonomy}`;
          message += obj.sampleId ? `Sample: ${obj.sampleId}` : "";
        } else if (obj.taxonId) {
          const newOptions = {
            query: `tax_tree(${obj.taxonId}) AND sample_location=${latLon}`,
            result: "sample",
            taxonomy: options.taxonomy,
          };
          const url = `${basename || ""}/search?${qs.stringify(newOptions)}`;
          link = url;
          message += "Click to view samples from this location";
        }
        let label = message;
        if (link) {
          label += `\n${link}`;
        }
        points.push({
          lat,
          lng,
          color,
          label,
          ...obj,
        });
      } else {
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
            <NavLink url={url}>
              click to view samples from this location
            </NavLink>
          );
        }
        // TODO: handle assemblyId
        message = (
          <>
            {message} {link}
          </>
        );
        points.push(
          <SingleMarker
            key={i}
            position={arr}
            color={color}
            setHighlightPointLocation={setHighlightPointLocation}
          >
            <Popup>{message}</Popup>
          </SingleMarker>,
        );
      }
      i++;
    }
  }
  return points;
  // For non-globe view, return a list of leaflet markers
}
