import Markdown from "./Markdown";
import React from "react";
import { compose } from "redux";
import getPrimaryAssemblyId from "#functions/getPrimaryAssemblyId";
import withRecord from "#hocs/withRecord";

const LineageSummaryPanel = ({ record, taxonId }) => {
  if (!record || !record.record || !record.record.attributes) {
    return null;
  }

  return <Markdown pageId={"lineage_summary.md"} taxonId={taxonId} />;
};

export default compose(withRecord)(LineageSummaryPanel);
