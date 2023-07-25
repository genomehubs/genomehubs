import React, { useEffect } from "react";

import Page from "./Page";
import ReportFull from "./ReportFull";
import classnames from "classnames";
import { compose } from "recompose";
import dispatchLookup from "../hocs/dispatchLookup";
import qs from "../functions/qs";
import { sortReportQuery } from "../selectors/report";
import styles from "./Styles.scss";
import { useLocation } from "@reach/router";
import withTaxonomy from "../hocs/withTaxonomy";

const SourcesPanel = ({ setLookupTerm, taxonomy }) => {
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.textPanel
  );
  const location = useLocation();
  let queryString = location.search.replace(/^\?/, "");
  let hashTerm = decodeURIComponent(location.hash.replace(/^\#/, ""));
  let result = "taxon";
  let query = sortReportQuery({
    queryString: qs.stringify({
      result,
      ...qs.parse(queryString),
      report: "sources",
      taxonomy,
    }),
  });

  useEffect(() => {
    setLookupTerm(hashTerm);
  }, [hashTerm]);

  return (
    <div className={css} style={{ maxHeight: "100%" }}>
      <ReportFull
        reportId={query}
        report={"sources"}
        queryString={queryString}
      />
    </div>
  );
};

export default compose(dispatchLookup, withTaxonomy)(SourcesPanel);
