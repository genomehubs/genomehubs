import React, { Fragment, memo } from "react";

import ExplorePage from "./ExplorePage";
import GenericPage from "./GenericPage";
import Landing from "./Landing";
import MissingPage from "./MissingPage";
import RecordPage from "./RecordPage";
import Redirect from "./Redirect";
import ReportPage from "./ReportPage";
import { Router } from "@reach/router";
import SearchPage from "./SearchPage";
import SourcesPage from "./SourcesPage";
import classnames from "classnames";
import { compose } from "recompose";
import loadable from "@loadable/component";
import styles from "./Styles.scss";
import withRoutes from "../hocs/withRoutes";
import withSiteName from "../hocs/withSiteName";

const fixedRoutes = { search: true, explore: true, records: true };

const Main = ({ routes, basename }) => {
  if (routes.allIds.length == 0) {
    return null;
  }
  let css = classnames(styles.fillParent);
  let paths = [
    <Landing path="/" key="/" />,
    <SearchPage path="/search" key="/search" />,
    <ExplorePage path="/explore" key="/explore" />,
    <Redirect
      path="/records"
      key="/records"
      to="/record"
      replace={{ record_id: "recordId" }}
    />,
    <RecordPage path="/record" key="/record" />,
    <SourcesPage path="/sources" key="/sources" />,
    <ReportPage path="/report" key="/report" />,
    <MissingPage default />,
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

export default compose(memo, withSiteName, withRoutes)(Main);
