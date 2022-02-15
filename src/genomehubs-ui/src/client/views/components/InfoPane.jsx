import React, { memo, useState } from "react";
import { compose } from "recompose";
import classnames from "classnames";
import styles from "./Styles.scss";
import loadable from "@loadable/component";
import { Link } from "@reach/router";

const InfoCard = loadable(() => import("./InfoCard"));

const InfoPane = (props) => {
  const [hover, setHover] = useState(false);
  let css = classnames(
    styles.flexCenter,
    styles.flexCenterHorizontal,
    styles.infoPane,
    styles.infoPaneDefault,
    styles.fixedAr,
    styles.fixedArSixteenNine
  );
  let placeholder;
  if (props.image) {
    placeholder = props.image;
  } else {
    placeholder = "placeholder.png";
  }
  let desc_css = classnames(styles.fillParent, styles.infoPaneDescription, {
    [styles.infoPaneHoverReveal]: hover,
  });
  return (
    <Link
      className={css}
      to={props.view}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <InfoCard {...props} />
    </Link>
  );
};

export default compose(memo)(InfoPane);
