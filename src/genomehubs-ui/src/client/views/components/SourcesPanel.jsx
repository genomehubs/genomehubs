import {
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  textPanel as textPanelStyle,
} from "./Styles.scss";

import ReportFull from "./ReportFull";
import classnames from "classnames";
import { compose } from "redux";
import dispatchLookup from "#hocs/dispatchLookup";
import qs from "#functions/qs";
import { sortReportQuery } from "#selectors/report";
import { useEffect } from "react";
import { useLocation } from "@reach/router";
import withTaxonomy from "#hocs/withTaxonomy";

const SourcesPanel = ({ setLookupTerm, taxonomy }) => {
  let css = classnames(infoPanelStyle, infoPanel1ColumnStyle, textPanelStyle);
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
