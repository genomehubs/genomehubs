import { useLocation, useNavigate } from "@reach/router";

import ColorButton from "./ColorButton";
import LinkIcon from "@mui/icons-material/Link";
import React from "react";
import { compose } from "recompose";
import withSiteName from "../hocs/withSiteName";

const LinkButton = ({ options, basename }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const permaLink = () => {
    let pathname = location.pathname.replace(/^\//, "");
    if (pathname == options[0]) {
      pathname = options[1];
    } else {
      pathname = options[0];
    }
    navigate(`${basename}/${pathname}${location.search}${location.hash}}`);
  };

  return (
    <ColorButton
      // color="primary"
      size="small"
      aria-controls={open ? "split-button-menu" : undefined}
      aria-expanded={open ? "true" : undefined}
      aria-label="select merge strategy"
      aria-haspopup="menu"
      onClick={permaLink}
    >
      <LinkIcon />
    </ColorButton>
  );
};

export default compose(withSiteName)(LinkButton);
