import Markdown from "./Markdown";
import React from "react";
import { compose } from "recompose";
import withRecord from "../hocs/withRecord";

const AssemblySummaryPanel = ({ record, taxonId, assemblyId }) => {
  if (!record || !record.record || !record.record.attributes) {
    return null;
  }

  return (
    <Markdown
      pageId={"assembly_summary.md"}
      taxonId={taxonId}
      assemblyId={assemblyId}
    />
  );
};

export default compose(withRecord)(AssemblySummaryPanel);
