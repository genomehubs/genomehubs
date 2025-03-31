import React, { Fragment, memo } from "react";

import ExplorePage from "./ExplorePage";
import GenericPage from "./GenericPage";
import Landing from "./Landing";
import LogoPage from "./LogoPage";
import MissingPage from "./MissingPage";
import RecordPage from "./RecordPage";
import Redirect from "./Redirect";
import ReportPage from "./ReportPage";
import { Router } from "@reach/router";
import SearchPage from "./SearchPage";
import SourcesPage from "./SourcesPage";
import TypesPage from "./TypesPage";
import classnames from "classnames";
import { compose } from "recompose";
import { fillParent as fillParentStyle } from "./Styles.scss";
import withRoutes from "../hocs/withRoutes";
import withSiteName from "../hocs/withSiteName";

const fixedRoutes = { search: true, explore: true, records: true };

const Main = ({ routes, basename }) => {
  if (routes.allIds.length == 0) {
    return null;
  }
  let css = classnames(fillParentStyle);
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
    <TypesPage path="/types" key="/types" />,
    <ReportPage path="/report" key="/report" />,
    <MissingPage default key="404" />,
    <LogoPage path="/links" key="/links" />,
  ];
  routes.allIds.forEach((routeName) => {
    if (!fixedRoutes[routeName]) {
      paths.push(
        <GenericPage
          path={`/${routeName}`}
          pageId={routes.byId[routeName].pageId}
          key={routeName}
        />,
      );
    }
    paths.push(<GenericPage path={`/${routeName}/*`} key={"other"} />);
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
