import "leaflet/dist/leaflet.css";

import {
  CircleMarker,
  LayerGroup,
  MapContainer,
  Pane,
  Popup,
  TileLayer,
} from "react-leaflet";
import MultiCatLegend, { processLegendData } from "./MultiCatLegend";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "@reach/router";

import Grid from "@material-ui/core/Grid";
import LocationMapHighlightIcon from "./LocationMapHighlightIcon";
import NavLink from "./NavLink";
import ZoomComponent from "./ZoomComponent";
import { compose } from "recompose";
import dispatchMessage from "../hocs/dispatchMessage";
import qs from "../functions/qs";
import useResize from "../hooks/useResize";
import withColors from "../hocs/withColors";
import withSearchIndex from "../hocs/withSearchIndex";
import withSiteName from "../hocs/withSiteName";

const SingleMarker = ({
  position,
  color = "#fec44f",
  children,
  setHighlightPointLocation = () => {},
}) => {
  return (
    <CircleMarker
      eventHandlers={{
        mouseover: (e) => setHighlightPointLocation(position.join(",")),
        mouseout: (e) => setHighlightPointLocation(""),
      }}
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
    let coords = obj.coords;
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
        </SingleMarker>
      );
      i++;
    }
  }

  return markers;
};

const Map = ({
  bounds,
  markers,
  width,
  height,
  geoPoints = [],
  zoom = 10,
  meta = {},
  taxonId,
}) => {
  const location = useLocation();
  if (width == 0) {
    return null;
  }

  // useEffect(() => {
  //   return globalHistory.listen(({ action, location }) => {
  //     if (action === "PUSH" || action === "POP") {
  //       setZoomPointLocation(false);
  //       setHighlightPointLocation(false);
  //     }
  //   });
  // }, []);
  // let { markers, bounds } = MarkerComponent({
  //   geoPoints,
  //   meta,
  //   options,
  //   taxonId,
  // });

  return (
    <MapContainer
      bounds={bounds}
      scrollWheelZoom={false}
      tap={false}
      style={{
        marginTop: "1em",
        width: `${width}px`,
        height: `${height}px`,
        background: "none",
      }}
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
      />
      {markers}
    </MapContainer>
  );
};

const ReportMap = ({
  map,
  chartRef,
  containerRef,
  searchIndexPlural,
  embedded,
  ratio,
  stacked,
  setMessage,
  colors,
  levels,
  minDim,
  setMinDim,
  xOpts,
  basename,
}) => {
  const navigate = useNavigate();
  const componentRef = chartRef ? chartRef : useRef();
  const { width, height } = containerRef
    ? useResize(containerRef)
    : useResize(componentRef);
  useEffect(() => {
    if (map && map.status) {
      setMessage(null);
    }
  }, [map]);

  let options = qs.parse(location.search.replace(/^\?/, ""));
  if (map && map.status) {
    let bounds = map.report.map.bounds;
    let geoBounds = bounds.stats.geo.bounds;
    geoBounds = [
      [geoBounds.top_left.lat + 1, geoBounds.top_left.lon - 1],
      [geoBounds.bottom_right.lat - 1, geoBounds.bottom_right.lon + 1],
    ];

    let pointData = map.report.map.map.rawData;
    let markers = [];
    if (bounds.cats) {
      if (levels[bounds.cats.length]) {
        colors = levels[bounds.cats.length];
      }
      bounds.cats.forEach((obj, i) => {
        markers.push(
          <MarkerComponent
            key={i}
            geoPoints={pointData[obj.key]}
            color={colors[i]}
            options={options}
            basename={basename}
          />
        );
      });
      if (bounds.showOther) {
        let i = bounds.cats.length;
        markers.push(
          <MarkerComponent
            key={i}
            geoPoints={pointData["other"]}
            color={colors[i]}
            options={options}
          />
        );
      }
    } else {
      markers.push(
        <MarkerComponent
          key={0}
          geoPoints={pointData[`all ${searchIndexPlural}`]}
          color={colors[0]}
          options={options}
        />
      );
    }

    return (
      <Grid item xs ref={componentRef} style={{ height: "100%" }}>
        <Map
          bounds={geoBounds}
          markers={markers}
          width={width}
          height={height}
        />
      </Grid>
    );
  } else {
    return null;
  }
};

export default compose(
  withSiteName,
  dispatchMessage,
  withColors,
  withSearchIndex
)(ReportMap);
