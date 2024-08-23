import React, { memo, useState } from "react";
import {
  fillParent as fillParentStyle,
  fixedArSixteenNine as fixedArSixteenNineStyle,
  fixedAr as fixedArStyle,
  flexCenterHorizontal as flexCenterHorizontalStyle,
  flexCenter as flexCenterStyle,
  infoPaneDefault as infoPaneDefaultStyle,
  infoPaneDescription as infoPaneDescriptionStyle,
  infoPaneHoverReveal as infoPaneHoverRevealStyle,
  infoPane as infoPaneStyle,
} from "./Styles.scss";

// import loadable from "@loadable/component";
import InfoCard from "./InfoCard";
import { Link } from "@reach/router";
import classnames from "classnames";
import { compose } from "recompose";

// const InfoCard = loadable(() => import("./InfoCard"));

const InfoPane = (props) => {
  const [hover, setHover] = useState(false);
  let css = classnames(
    flexCenterStyle,
    flexCenterHorizontalStyle,
    infoPaneStyle,
    infoPaneDefaultStyle,
    fixedArStyle,
    fixedArSixteenNineStyle
  );
  let placeholder;
  if (props.image) {
    placeholder = props.image;
  } else {
    placeholder = "placeholder.png";
  }
  let desc_css = classnames(fillParentStyle, infoPaneDescriptionStyle, {
    [infoPaneHoverRevealStyle]: hover,
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
