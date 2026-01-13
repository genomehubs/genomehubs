import Markdown from "./Markdown";
import React from "react";
import { compose } from "redux";
import withRecord from "#hocs/withRecord";

const TaxonSummaryPanel = ({ record, taxonId, scientific_name }) => {
  if (!record || !record.record || !record.record.attributes) {
    return null;
  }

  return (
    <Markdown
      pageId={"taxon_summary.md"}
      taxonId={taxonId}
      scientific_name={scientific_name}
    />
  );
};

export default compose(withRecord)(TaxonSummaryPanel);
