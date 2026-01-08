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
import { compose } from "redux";
import withLoading from "../hocs/withLoading";
import withSiteName from "#hocs/withSiteName";

const LoadingScreen = ({ types, basename, siteName, loading, setLoading }) => {
  const [show, setShow] = useState(loading);

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
              <Logo animate={true} delay={2} />
            </div>
          </div>
          <h1>loading {siteName}...</h1>
        </div>
      </div>
    </span>
  );
};

export default compose(withSiteName, withLoading)(LoadingScreen);
