import { Helmet } from "react-helmet";
import React from "react";
import { compose } from "redux";
import withSiteName from "#hocs/withSiteName";

const Head = ({ siteName, basename }) => {
  return (
    <Helmet>
      <meta charset="utf8" />
      <title>{siteName}</title>
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href={basename + "/assets/apple-touch-icon.png"}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href={basename + "/assets/favicon-32x32.png"}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href={basename + "/assets/favicon-16x16.png"}
      />
      <link rel="manifest" href={basename + "/assets/manifest.json"} />
    </Helmet>
  );
};

export default compose(withSiteName)(Head);
