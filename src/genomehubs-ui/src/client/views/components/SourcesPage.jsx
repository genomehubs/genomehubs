import React, { useEffect } from "react";

import Page from "./Page";
import ReportFull from "./ReportFull";
import { compose } from "recompose";
import dispatchLookup from "../hocs/dispatchLookup";
import qs from "qs";
import { sortReportQuery } from "../selectors/report";
import withTaxonomy from "../hocs/withTaxonomy";

const SourcesPage = ({
  location,
  setLookupTerm,
  topLevel,
  taxonomy,
  ...props
}) => {
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

  let content = (
    <div>
      <ReportFull
        reportId={query}
        report={"sources"}
        queryString={queryString}
      />
    </div>
  );
  return <Page searchBox={true} topLevel={false} text={content} />;
};

export default compose(dispatchLookup, withTaxonomy)(SourcesPage);
