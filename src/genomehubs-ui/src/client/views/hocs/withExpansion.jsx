import React, { useState } from "react";
import { CSSTransition } from "react-transition-group";
import styles from "./withExpansion.scss";

const withExpansion = (WrappedComponent) => (props) => {
  return (
    <CSSTransition in={true} timeout={1000} classNames={{ ...styles }} appear>
      <WrappedComponent {...props} />
    </CSSTransition>
  );
};

export default withExpansion;
