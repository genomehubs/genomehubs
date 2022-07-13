import React, { memo } from "react";

import Grid from "@material-ui/core/Grid";
import Markdown from "./Markdown";
import NavLink from "./NavLink";
import Tab from "./Tab";
import classnames from "classnames";
import { compose } from "recompose";
// import withPages from "../hocs/withPages";
// import dispatchTerms from "../hocs/dispatchTerms";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import withSiteName from "../hocs/withSiteName";

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
      let [term, params] = props.children[0].replace(/\n$/, "").split("::");
      let url = `${basename}/search?query=${term}&${params}#${term}`;
      return (
        <Grid item>
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
