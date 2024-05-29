import Markdown from "./Markdown";
import React from "react";
import { compose } from "recompose";
import withRecord from "../hocs/withRecord";

const FeatureSummaryPanel = ({
  record,
  taxonId,
  assemblyId,
  start,
  end,
  sequenceName,
}) => {
  if (!record || !record.record || !record.record.attributes) {
    return null;
  }

  return (
    <Markdown
      pageId={"feature_summary.md"}
      taxonId={taxonId}
      assemblyId={assemblyId}
      start={start}
      end={end}
      sequenceName={sequenceName}
    />
  );
};

export default compose(withRecord)(FeatureSummaryPanel);
