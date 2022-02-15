import React, { Fragment, memo, useRef } from "react";

import Page from "./Page";
import TextPanel from "./TextPanel";
import { compose } from "recompose";

const Landing = () => {
  const componentRef = useRef();
  let panels = [];
  let text = <TextPanel view={"about"} pageId={"landing.md"}></TextPanel>;
  panels.push({ panel: text, minWidth: "80%" });
  return <Page searchBox panels={panels} pageRef={componentRef} />;
};

export default compose(memo)(Landing);
