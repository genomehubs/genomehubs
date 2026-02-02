import { Helmet } from "react-helmet";
import { compose } from "redux";
import withSiteName from "#hocs/withSiteName";

const getAssetUrl = (asset) => {
  const raw = window?.process?.ENV?.GH_BASENAME ?? BASENAME ?? "";
  const clean = String(raw).replace(/^\/+|\/+$/g, "");
  const basePrefix = clean ? `/${clean}` : ""; // "/archive" or ""
  return `${basePrefix}/assets/${asset}`;
};

const Head = ({ siteName, basename }) => {
  return (
    <Helmet>
      <meta charset="utf8" />
      <title>{siteName}</title>
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href={getAssetUrl("apple-touch-icon.png")}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href={getAssetUrl("favicon-32x32.png")}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href={getAssetUrl("favicon-16x16.png")}
      />
      <link rel="manifest" href={getAssetUrl("manifest.json")} />
    </Helmet>
  );
};

export default compose(withSiteName)(Head);
