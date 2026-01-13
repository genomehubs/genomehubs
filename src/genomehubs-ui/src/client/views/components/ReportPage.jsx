import React, { useEffect } from "react";
import {
  fillParent as fillParentStyle,
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  textPanel as textPanelStyle,
} from "./Styles.scss";

import Page from "./Page";
import ReportFull from "./ReportFull";
import classnames from "classnames";
import { compose } from "redux";
import dispatchLookup from "#hocs/dispatchLookup";
import qs from "#functions/qs";
import { sortReportQuery } from "#selectors/report";

const ReportPage = ({ location, setLookupTerm, topLevel, ...props }) => {
  let queryString = location.search.replace(/^\?/, "");
  let hashTerm = decodeURIComponent(location.hash.replace(/^\#/, ""));
  // let query = sortReportQuery({ queryString });

  useEffect(() => {
    setLookupTerm(hashTerm);
  }, [hashTerm]);

  let css = classnames(
    { [infoPanelStyle]: !topLevel },
    { [infoPanel1ColumnStyle]: !topLevel },
    { [textPanelStyle]: !topLevel },
    fillParentStyle
  );
  let content = (
    <div className={css}>
      <ReportFull
        reportId={sortReportQuery({ queryString })}
        report={qs.parse(queryString).report}
        queryString={queryString}
        topLevel={topLevel}
      />
    </div>
  );
  return <Page searchBox={!topLevel} topLevel={topLevel} text={content} />;
};

export default compose(dispatchLookup)(ReportPage);
