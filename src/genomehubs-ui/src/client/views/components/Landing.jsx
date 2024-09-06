import React, { Fragment, memo, useRef } from "react";

import Page from "./Page";
import TextPanel from "./TextPanel";
import { compose } from "recompose";

const Landing = () => {
  const componentRef = useRef();
  let titleStyles = {
    minWidth: "80%",
    paddingBottom: "0px",
    border: "none",
    borderBottom: "0.2em solid #98999f",
    paddingBottom: "2em",
  };
  let exampleStyles = {
    minWidth: "80%",
    paddingBottom: "0px",
    marginTop: "-0.5em",
    paddingTop: "0px",
    border: "none",
  };

  let browseStyles = { ...exampleStyles };
  let textStyles = {
    // marginTop: "0px",
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
          paddingTop: "0px",
        },
      ]}
      browsePanels={[
        {
          panel: browse,
          paddingTop: "0px",
        },
      ]}
      pageRef={componentRef}
    />
  );
};

export default compose(memo)(Landing);
