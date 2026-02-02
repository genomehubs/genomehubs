import { CSSTransition } from "react-transition-group";
import styles from "./withFadeInOut.scss";
import { useState } from "react";

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
