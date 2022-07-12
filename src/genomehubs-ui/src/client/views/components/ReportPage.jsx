import React, { useEffect } from "react";

import Page from "./Page";
import ReportFull from "./ReportFull";
import classnames from "classnames";
import { compose } from "recompose";
import dispatchLookup from "../hocs/dispatchLookup";
import qs from "../functions/qs";
import { sortReportQuery } from "../selectors/report";
import styles from "./Styles.scss";

const ReportPage = ({ location, setLookupTerm, topLevel, ...props }) => {
  let queryString = location.search.replace(/^\?/, "");
  let hashTerm = decodeURIComponent(location.hash.replace(/^\#/, ""));
  // let query = sortReportQuery({ queryString });

  useEffect(() => {
    setLookupTerm(hashTerm);
  }, [hashTerm]);

  let css = classnames(
    { [styles.infoPanel]: !topLevel },
    { [styles[`infoPanel1Column`]]: !topLevel },
    { [styles.textPanel]: !topLevel },
    styles.fillParent
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
