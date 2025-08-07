import ChipSearch from "./ChipSearch";
import { Provider } from "react-redux";
import React from "react";
import colorStore from "../../reducers/color.store";

const lookupFunction = ({
  lookupTerm,
  key,
  modifier,
  apiUrl = "https://goat.genomehubs.org/api/v2",
  result = "taxon",
  taxonomy = "ncbi",
}) => {
  if (key === "tax") {
    const apiUrl = "https://goat.genomehubs.org/api/v2";
    let options = {
      searchTerm: lookupTerm.replace(/\[.*/, ""),
      result,
      taxonomy,
    };

    const formatResults = (json) => {
      if (!json) {
        return [];
      }
      if (json.results && json.results.length > 0) {
        return json.results.map((obj) => {
          let result = {};
          if (obj.reason && obj.reason.length > 0) {
            Object.entries(obj.reason[0].fields).forEach(([key, value]) => {
              if (key.endsWith("class")) {
                result.class = value[0];
              } else if (key.endsWith("raw")) {
                result.value = value[0];
              }
            });
            result.match = "partial";
          } else {
            result.value = options.searchTerm;
            if (obj.result.taxon_id == options.searchTerm) {
              result.class = "taxon_id";
              result.match = "exact";
            } else if (obj.result.scientific_name == options.searchTerm) {
              result.class = "scientific_name";
              result.match = "exact";
            } else {
              for (let [key, value] of Object.entries(
                obj.result.taxon_names || {},
              )) {
                if (value.toLowerCase() === options.searchTerm.toLowerCase()) {
                  result.class = key;
                  result.match = "exact";
                  result.value = value;
                  break;
                }
              }
            }
          }
          result.taxon_id = obj.result.taxon_id;
          result.scientific_name = obj.result.scientific_name;
          return result;
        });
      }
    };

    let url = `${apiUrl}/lookup?searchTerm=${options.searchTerm}&result=${options.result}&taxonomy=${options.taxonomy}`;
    return fetch(url)
      .then(
        (response) => response.json(),
        (error) => console.log("An error occured.", error),
      )
      .then((json) => {
        return formatResults(json);
      })
      .catch((err) => {
        console.error("Error fetching lookup data:", err);
      });
  }
};

export default {
  title: "Components/ChipSearch",
  component: ChipSearch,
  decorators: [(story) => <Provider store={colorStore}>{story()}</Provider>],
};

const Template = (args) => <ChipSearch {...args} />;

export const Default = Template.bind({});
Default.args = {
  lookupFunction,
};

export const WithInitialChips = Template.bind({});
WithInitialChips.args = {
  ...Default.args,
  value: "assembly_span=100000000 AND tax_tree(2759)",
};

export const Compact = Template.bind({});
Compact.args = {
  ...Default.args,
  compact: true,
};

export const CompactWithInitialChips = Template.bind({});
CompactWithInitialChips.args = {
  ...Compact.args,
  compact: true,
  value: "assembly_span=100000000 AND tax_tree(2759)",
};

export const WithValueNote = Template.bind({});
WithValueNote.args = {
  ...Default.args,
  value: "assembly_span=100000000 AND tax_tree(2759[Eukaryota])",
};

export const WithValueNotes = Template.bind({});
WithValueNotes.args = {
  ...Default.args,
  value:
    "assembly_span=100000000 AND tax_tree(2759[Eukaryota],9608[Canidae],3701[Arabidopsis])",
};

export const LongInput = Template.bind({});
LongInput.args = {
  ...Default.args,
  value:
    "assembly_span=100000000 AND tax_tree(2759) AND assembly_level=chromosome AND collate(sequence_id,name)",
  showText: true,
};

export const CustomPlaceholder = Template.bind({});
CustomPlaceholder.args = {
  ...Default.args,
  placeholder: "Enter your search query here...",
};

export const WithInvalidChips = Template.bind({});
WithInvalidChips.args = {
  ...Default.args,
  value:
    "assembly_span=100000000 AND tax_tree(2759) AND invalid_chip AND assembly_span=invalid_value AND bioproject<=PRJEB40665,PRJEB40665 AND min(bioproject)=PRJEB40665,PRJEB40665",
};

export const WithDuplication = Template.bind({});
WithDuplication.args = {
  ...Default.args,
  value:
    "assembly_span=100000000 AND tax_tree(2759) AND assembly_span=100000000 AND bioproject=PRJEB40665,PRJEB40665",
};

export const WithCrypticDuplication = Template.bind({});
WithCrypticDuplication.args = {
  ...Default.args,
  value:
    "assembly_span=100000000 AND tax_tree(2759) AND assembly_span=100M AND bioproject=PRJEB40665,null AND bioproject=PRJEB40665,null AND bioproject=null,PRJEB40665",
};

export const WithNegation = Template.bind({});
WithNegation.args = {
  ...Default.args,
  value:
    "assembly_span=100000000 AND tax_tree(2759,!33090) AND bioproject=PRJEB40665,!PRJEB40665",
};

export const WithConflictingChips = Template.bind({});
WithConflictingChips.args = {
  ...Default.args,
  value:
    "tax_tree(2759) AND tax_tree(!3702) AND assembly_span=100000000 AND assembly_span=3G AND assembly_span AND assembly_level=chromosome AND assembly_level=scaffold AND bioproject=123 AND bioproject=456 AND chromosome_number = 3, 4",
};

export const LargeChipGroup = Template.bind({});
LargeChipGroup.args = {
  ...Default.args,
  value:
    "tax_tree(2759) AND assembly_span=100000000 AND bioproject=PRJEB40665 AND bioproject=PRJEB40656 AND bioproject=PRJEB40657 AND bioproject=PRJEB40658 AND bioproject=PRJEB40659 AND bioproject=PRJEB40660 AND bioproject=PRJEB40661 AND bioproject=PRJEB40662 AND chromosome_number=2",
};
