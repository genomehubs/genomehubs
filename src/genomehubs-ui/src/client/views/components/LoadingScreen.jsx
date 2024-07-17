import React, { useEffect, useState } from "react";

import Logo from "./Logo";
import { compose } from "recompose";
import styles from "./Styles.scss";
import withLoading from "../hocs/withLoading";
import withSiteName from "../hocs/withSiteName";

const LoadingScreen = ({ types, basename, siteName, loading, setLoading }) => {
  const [show, setShow] = useState(loading);

  useEffect(() => {
    console.log(loading);
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
    <span className={loading == "started" ? styles.fadeIn : styles.fadeOut}>
      <div className={styles.loadingScreen}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingLogo}>
            <div className={styles.loader}>
              <Logo />
            </div>
          </div>
          <h1>loading {siteName}...</h1>
        </div>
      </div>
    </span>
  );
};

export default compose(withSiteName, withLoading)(LoadingScreen);
