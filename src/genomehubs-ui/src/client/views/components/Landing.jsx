import React, { Fragment, memo, useRef } from "react";

import Page from "./Page";
import TextPanel from "./TextPanel";
import { compose } from "recompose";

const Landing = () => {
  const componentRef = useRef();
  let titleStyles = {
    minWidth: "80%",
    paddingBottom: 0,
    border: "none",
    borderBottom: "0.2em solid #98999f",
    paddingBottom: "2em",
  };
  let exampleStyles = {
    minWidth: "80%",
    paddingBottom: 0,
    marginTop: "-0.5em",
    paddingTop: 0,
    border: "none",
  };

  let browseStyles = { ...exampleStyles };
  let textStyles = {
    // marginTop: 0,
  };
  let title = <TextPanel pageId={"title.md"} {...titleStyles}></TextPanel>;
  let examples = (
    <TextPanel pageId={"examples.md"} {...exampleStyles}></TextPanel>
  );
  let browse = <TextPanel pageId={"browse.md"} {...browseStyles}></TextPanel>;
  let text = <TextPanel pageId={"landing.md"} {...textStyles}></TextPanel>;
  return (
    <Page
      landingPage
      searchBox
      panels={[{ panel: text, minWidth: "80%" }]}
      preSearchPanels={[
        {
          panel: title,
        },
      ]}
      searchPanels={[
        {
          panel: examples,
          paddingTop: 0,
        },
      ]}
      browsePanels={[
        {
          panel: browse,
          paddingTop: 0,
        },
      ]}
      pageRef={componentRef}
    />
  );
};

export default compose(memo)(Landing);
