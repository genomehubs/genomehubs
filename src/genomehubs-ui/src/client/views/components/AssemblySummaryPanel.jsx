import Markdown from "./Markdown";
import React from "react";
import { compose } from "redux";
import withRecord from "../hocs/withRecord";

const AssemblySummaryPanel = ({ records, taxonId, assemblyId }) => {
  let record = records[assemblyId];
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
