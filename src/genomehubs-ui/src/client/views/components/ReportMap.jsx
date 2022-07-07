import "leaflet/dist/leaflet.css";

import {
  CircleMarker,
  MapContainer,
  Pane,
  Popup,
  TileLayer,
} from "react-leaflet";
import MultiCatLegend, { processLegendData } from "./MultiCatLegend";
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "@reach/router";

import Grid from "@material-ui/core/Grid";
import LocationMapHighlightIcon from "./LocationMapHighlightIcon";
import NavLink from "./NavLink";
import ZoomComponent from "./ZoomComponent";
import { compose } from "recompose";
import dispatchMessage from "../hocs/dispatchMessage";
import qs from "qs";
import useResize from "../hooks/useResize";
import withColors from "../hocs/withColors";

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
  geoPoints,
  color,
  meta,
  options,
  taxonId,
  setHighlightPointLocation = () => {},
}) => {
  let positions = [];
  for (let obj of geoPoints) {
    let coords = obj.coords;
    if (!Array.isArray(coords)) {
      coords = [coords];
    }
    for (let latLon of coords) {
      let arr = latLon.split(",");
      positions.push(arr);
    }
  }
  let markers = positions.map((position, i) => {
    // TODO: add lookup to link pins to samples
    let message;
    // if (meta.values && meta.values.length == positions.length) {
    //   let link = (
    //     <NavLink
    //       url={`/record?recordId=${meta.values[i].source_id}&result=${meta.values[i].source_index}&taxonomy=${options.taxonomy}`}
    //     >
    //       {meta.values[i].source_id}
    //     </NavLink>
    //   );
    //   message = (
    //     <>
    //       click to view full record for {meta.values[i].source_index}: {link}
    //     </>
    //   );
    // } else if (taxonId) {
    //   let newOptions = {};
    //   // if (options.recordId) {
    //   newOptions = {
    //     query: `tax_tree(${taxonId}) AND sample_location=${position.join(",")}`,
    //     result: "sample",
    //     taxonomy: options.taxonomy,
    //   };

    //   let url = `/search?${qs.stringify(newOptions)}`;
    //   let link = (
    //     <NavLink url={url}>click to view samples from this location</NavLink>
    //   );
    //   message = link;
    // }
    return (
      <SingleMarker
        key={i}
        position={position}
        color={color}
        setHighlightPointLocation={setHighlightPointLocation}
      >
        <Popup>{message}</Popup>
      </SingleMarker>
    );
  });
  return <Pane key={color}>{markers}</Pane>;
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
  let options = qs.parse(location.search.replace(/^\?/, ""));
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
  embedded,
  ratio,
  stacked,
  setMessage,
  colors,
  minDim,
  setMinDim,
  xOpts,
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
  if (map && map.status) {
    let bounds = map.report.map.bounds;
    let geoBounds = bounds.stats.geo.bounds;
    geoBounds = [
      [geoBounds.top_left.lat, geoBounds.top_left.lon],
      [geoBounds.bottom_right.lat, geoBounds.bottom_right.lon],
    ];

    let pointData = map.report.map.map.rawData;
    let markers = [];
    bounds.cats.forEach((obj, i) => {
      markers.push(
        <MarkerComponent
          key={i}
          geoPoints={pointData[obj.key]}
          color={colors[i]}
        />
      );
    });

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

export default compose(dispatchMessage, withColors)(ReportMap);
