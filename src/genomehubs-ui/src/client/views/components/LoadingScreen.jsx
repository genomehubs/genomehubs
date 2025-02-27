import React, { useEffect, useState } from "react";
import {
  fadeIn as fadeInStyle,
  fadeOut as fadeOutStyle,
  loader as loaderStyle,
  loadingContainer as loadingContainerStyle,
  loadingLogo as loadingLogoStyle,
  loadingScreen as loadingScreenStyle,
} from "./Styles.scss";

import Logo from "./Logo";
import { compose } from "recompose";
import withColors from "../hocs/withColors";
import withLoading from "../hocs/withLoading";
import withSiteName from "../hocs/withSiteName";
import withTheme from "../hocs/withTheme";

const LoadingScreen = ({
  types,
  basename,
  colorScheme,
  theme,
  siteName,
  loading,
  setLoading,
}) => {
  const [show, setShow] = useState(loading);
  let lineColor = colorScheme[theme].headerText;

  useEffect(() => {
    if (loading == "finished") {
      // Start the fade out animation
      const timer = setTimeout(() => {
        setShow(false); // Hide the component after the animation
        setLoading(false);
      }, 500); // Match the duration of your CSS transition
      return () => clearTimeout(timer);
    } else {
      setShow(true); // Immediately show the component when loading is true
    }
  }, [loading]);

  if (!show) {
    return null;
  }
  return (
    <span className={loading == "started" ? fadeInStyle : fadeOutStyle}>
      <div className={loadingScreenStyle}>
        <div className={loadingContainerStyle}>
          <div className={loadingLogoStyle}>
            <div className={loaderStyle}>
              <Logo lineColor={lineColor} />
            </div>
          </div>
          <h1>loading {siteName}...</h1>
        </div>
      </div>
    </span>
  );
};

export default compose(
  withSiteName,
  withTheme,
  withColors,
  withLoading,
)(LoadingScreen);
