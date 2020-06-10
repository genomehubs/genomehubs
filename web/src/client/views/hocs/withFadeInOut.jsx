import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { CSSTransition } from 'react-transition-group';
import styles from './withFadeInOut.scss';

const withFadeInOut = (WrappedComponent) => (props) => {
  const [visible, setVisible] = useState(true);
  return (
    <CSSTransition
      in={visible}
      timeout={1000}
      classNames={{ ...styles }}
      onExited={() => setVisible(false)}
      appear
    >
      <WrappedComponent {...props} />
    </CSSTransition>
  );
};

export default withFadeInOut;
