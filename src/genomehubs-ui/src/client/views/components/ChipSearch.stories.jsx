import ChipSearch from "./ChipSearch";
import { Provider } from "react-redux";
import React from "react";
import colorStore from "../reducers/color.store";

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
  initialChips: ["assembly_span=100000000", "AND", "tax_tree(2759)"],
};

export const WithValueNote = Template.bind({});
WithValueNote.args = {
  initialChips: ["assembly_span=100000000", "AND", "tax_tree(2759[Eukaryota])"],
};

export const LongInput = Template.bind({});
LongInput.args = {
  initialInput:
    "assembly_span=100000000 AND tax_tree(2759) AND assembly_level=chromosome AND collate(sequence_id,name)",
};

export const CustomPlaceholder = Template.bind({});
CustomPlaceholder.args = {
  placeholder: "Enter your search query here...",
};
