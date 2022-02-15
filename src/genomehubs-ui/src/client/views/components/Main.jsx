import React, { Fragment, memo } from "react";

import ExplorePage from "./ExplorePage";
import GenericPage from "./GenericPage";
import Landing from "./Landing";
import RecordPage from "./RecordPage";
import ReportPage from "./ReportPage";
import { Router } from "@reach/router";
import SearchPage from "./SearchPage";
import classnames from "classnames";
import { compose } from "recompose";
import loadable from "@loadable/component";
import styles from "./Styles.scss";
import withRoutes from "../hocs/withRoutes";

const basename = BASENAME || "";

const fixedRoutes = { search: true, explore: true, records: true };

const Main = ({ routes }) => {
  if (routes.allIds.length == 0) {
    return null;
  }
  let css = classnames(styles.fillParent);
  let paths = [
    <Landing path="/" key="/" />,
    <SearchPage path="/search" key="/search" />,
    <ExplorePage path="/explore" key="/explore" />,
    <RecordPage path="/records" key="/records" />,
    <ReportPage path="/report" key="/report" />,
  ];
  routes.allIds.forEach((routeName) => {
    if (!fixedRoutes[routeName]) {
      paths.push(
        <GenericPage
          path={`/${routeName}`}
          pageId={routes.byId[routeName].pageId}
          key={routeName}
        />
      );
    }
    paths.push(
      <GenericPage
        path={`/${routeName}/*`}
        key={"other"}
        // pageId={routes.byId[routeName].pageId}
      />
    );
  });
  return (
    <Fragment>
      <Router className={css} basepath={basename} primary={false}>
        {paths}
      </Router>
    </Fragment>
  );
};

export default compose(memo, withRoutes)(Main);
