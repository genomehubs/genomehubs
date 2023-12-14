import Count from "./Count";
import React from "react";

export const BadgeStats = ({
  currentRecord,
  currentRecordId,
  scientificName,
  taxonomy,
  result,
  rank,
}) => {
  return (
    <div>
      <Count
        currentRecord={currentRecord}
        result={"taxon"}
        taxonomy={taxonomy}
        query={`tax_tree(${currentRecordId}) AND tax_rank(species)`}
        includeEstimates={true}
        suffix={"species"}
        description={`${scientificName} has {count} descendant species`}
      />

      <Count
        currentRecord={currentRecord}
        result={"assembly"}
        taxonomy={taxonomy}
        query={`tax_tree(${currentRecordId}) AND assembly_level AND tax_rank(species)`}
        includeEstimates={true}
        suffix={"assembled"}
        description={`{count} species of ${scientificName} have at least one genome assembly at any level`}
      />

      <Count
        currentRecord={currentRecord}
        result={"taxon"}
        taxonomy={taxonomy}
        query={`tax_tree(${currentRecordId}) AND assembly_level>=chromosome AND tax_rank(species)`}
        includeEstimates={true}
        suffix={"chromosomal"}
        description={`{count} species of ${scientificName} have at least one chromosomal genome assembly`}
      />

      <Count
        currentRecord={currentRecord}
        result={"taxon"}
        taxonomy={taxonomy}
        query={`tax_name(${currentRecordId}) AND long_list`}
        includeEstimates={true}
        suffix={"project"}
        suffix_plural={"projects"}
        of={"values"}
        fields={"long_list"}
        description={`${scientificName} is on the declared target list for {count} projects`}
      />
    </div>
  );
};

export default BadgeStats;
