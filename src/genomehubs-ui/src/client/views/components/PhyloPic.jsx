import {
  blackToAncestral as blackToAncestralStyle,
  blackToDescendant as blackToDescendantStyle,
  blackToDirect as blackToDirectStyle,
  blackToPrimary as blackToPrimaryStyle,
} from "./Styles.scss";
import { useEffect, useState } from "react";

import { compose } from "redux";
import withApi from "#hocs/withApi";

const styleMap = {
  blackToAncestralStyle,
  blackToDescendantStyle,
  blackToDirectStyle,
  blackToPrimaryStyle,
};

const PhyloPic = ({
  fileUrl,
  dataUri,
  source = "Primary",
  ratio = 1,
  fixedRatio,
  maxHeight = 100,
}) => {
  const [src, setSrc] = useState(dataUri || fileUrl || false);
  const width = 300;

  useEffect(() => {
    setSrc(dataUri || fileUrl || false);
  }, [dataUri, fileUrl]);

  let imageWidth = fixedRatio
    ? maxHeight * ratio
    : Math.min(maxHeight * ratio, width);

  const handleError = () => {
    setSrc(dataUri || fileUrl || false);
  };

  return (
    <div>
      <img
        src={src}
        onError={handleError}
        className={styleMap[`blackTo${source}Style`]}
        style={{
          width: `${imageWidth}px`,
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      />
    </div>
  );
};

export default compose(withApi)(PhyloPic);
