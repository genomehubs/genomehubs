import { Helmet } from "react-helmet";
import React from "react";
import { compose } from "recompose";
import withSiteName from "../hocs/withSiteName";

const Head = ({ siteName, basename }) => {
  return (
    <Helmet>
      <meta charset="utf8" />
      <meta
        http-equiv="Content-Security-Policy"
        content="img-src 'self' data:"
      />
      <title>{siteName}</title>
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href={basename + "/apple-touch-icon.png"}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href={basename + "/favicon-32x32.png"}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href={basename + "/favicon-16x16.png"}
      />
      <link rel="manifest" href={basename + "/manifest.json"} />
      {/* <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.0.1/dist/leaflet.css"
      /> */}
    </Helmet>
  );
};

export default compose(withSiteName)(Head);
