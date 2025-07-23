import ChipSearch from "./ChipSearch";
import { Provider } from "react-redux";
import React from "react";
import colorStore from "../../reducers/color.store";

export default {
  title: "Components/ChipSearch",
  component: ChipSearch,
  decorators: [(story) => <Provider store={colorStore}>{story()}</Provider>],
};

const Template = (args) => <ChipSearch {...args} />;

export const Default = Template.bind({});
Default.args = {};

export const WithInitialChips = Template.bind({});
WithInitialChips.args = {
  value: "assembly_span=100000000 AND tax_tree(2759)",
};

export const Compact = Template.bind({});
Compact.args = {
  compact: true,
};

export const CompactWithInitialChips = Template.bind({});
CompactWithInitialChips.args = {
  compact: true,
  value: "assembly_span=100000000 AND tax_tree(2759)",
};

export const WithValueNote = Template.bind({});
WithValueNote.args = {
  value: "assembly_span=100000000 AND tax_tree(2759[Eukaryota])",
};

export const LongInput = Template.bind({});
LongInput.args = {
  value:
    "assembly_span=100000000 AND tax_tree(2759) AND assembly_level=chromosome AND collate(sequence_id,name)",
  showText: true,
};

export const CustomPlaceholder = Template.bind({});
CustomPlaceholder.args = {
  placeholder: "Enter your search query here...",
};

export const WithInvalidChips = Template.bind({});
WithInvalidChips.args = {
  value:
    "assembly_span=100000000 AND tax_tree(2759) AND invalid_chip AND assembly_span=invalid_value AND bioproject<=PRJEB40655,PRJEB40655 AND min(bioproject)=PRJEB40655,PRJEB40655",
};

export const WithDuplication = Template.bind({});
WithDuplication.args = {
  value:
    "assembly_span=100000000 AND tax_tree(2759) AND assembly_span=100000000 AND bioproject=PRJEB40655,PRJEB40655",
};

export const WithCrypticDuplication = Template.bind({});
WithCrypticDuplication.args = {
  value:
    "assembly_span=100000000 AND tax_tree(2759) AND assembly_span=100M AND bioproject=PRJEB40655,null AND bioproject=prjeb40655,null AND bioproject=null,prjeb40655",
};

export const WithNegation = Template.bind({});
WithNegation.args = {
  value:
    "assembly_span=100000000 AND tax_tree(2759,!33090) AND bioproject=PRJEB40655,!PRJEB40655",
};

export const WithConflictingChips = Template.bind({});
WithConflictingChips.args = {
  value:
    "tax_tree(2759) AND tax_tree(!3702) AND assembly_span=100000000 AND assembly_span=3G AND assembly_span AND assembly_level=chromosome AND assembly_level=scaffold AND bioproject=123 AND bioproject=456 AND chromosome_number = 3, 4",
};
