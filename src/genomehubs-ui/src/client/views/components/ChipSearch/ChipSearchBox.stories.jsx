import ChipSearchBox from "./ChipSearchBox";
import { Provider } from "react-redux";
import React from "react";
import colorStore from "../../reducers/color.store";
import lookupFunction from "./functions/lookupFunction";

export default {
  title: "Components/ChipSearchBox",
  component: ChipSearchBox,
  decorators: [(story) => <Provider store={colorStore}>{story()}</Provider>],
};

const Template = (args) => <ChipSearchBox {...args} />;

export const Default = Template.bind({});
Default.args = {
  lookupFunction,
  result: "taxon",
  setCurrentResult: () => {},
  results: ["taxon", "assembly", "sample"],
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
