import React, { memo } from "react";

import Grid from "@mui/material/Grid2";
import Markdown from "./Markdown";
import NavLink from "./NavLink";
import { compose } from "recompose";
import withSiteName from "#hocs/withSiteName";

const Terms = ({ basename }) => {
  const components = {
    ul: (props) => {
      return (
        <Grid container direction="column" spacing={1}>
          {props.children}
        </Grid>
      );
    },
    li: (props) => {
      let [term, params] = props.children[0].replace(/\r?\n$/, "").split("::");
      let url = `${basename}/search?query=${term}&${params}#${term}`;
      return (
        <Grid>
          <NavLink url={url} from={basename + "/"}>
            {term}
          </NavLink>
        </Grid>
      );
    },
  };
  return <Markdown pageId={"terms.md"} components={components} />;
};

export default compose(withSiteName)(Terms);
