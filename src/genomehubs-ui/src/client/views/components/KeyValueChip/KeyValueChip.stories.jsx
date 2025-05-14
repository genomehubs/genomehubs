import React, { useState } from "react";

import KeyValueChip from "./KeyValueChip";
import { Provider } from "react-redux";
import colorStore from "../../reducers/color.store";

export default {
  title: "Components/KeyValueChip",
  component: KeyValueChip,
  decorators: [(story) => <Provider store={colorStore}>{story()}</Provider>],
  argTypes: {
    keyLabel: { control: "text" },
    value: { control: "text" },
    operator: { control: { type: "select", options: ["=", ">=", "<="] } },
    modifier: { control: "text" },
    palette: {
      control: {
        type: "select",
        options: [
          "red",
          "orange",
          "yellow",
          "green",
          "blue",
          "purple",
          "grey",
          "black",
          "white",
        ],
      },
    },
    onChange: { action: "onChange" },
  },
};

const Template = (args) => {
  const [chipData, setChipData] = useState({
    key: args.keyLabel,
    value: args.value,
    operator: args.operator,
    modifier: args.modifier,
    palette: args.palette,
  });

  const handleChipChange = (updatedChip) => {
    setChipData(updatedChip);
    args.onChange(updatedChip);
  };

  return (
    <KeyValueChip
      keyLabel={chipData.key}
      value={chipData.value}
      operator={chipData.operator}
      modifier={chipData.modifier}
      palette={chipData.palette} // Pass the palette prop
      onChange={handleChipChange}
    />
  );
};

export const Default = Template.bind({});
Default.args = {
  keyLabel: "age",
  value: "30",
  operator: "=",
};

export const GreaterThanOrEqual = Template.bind({});
GreaterThanOrEqual.args = {
  keyLabel: "height",
  value: "180",
  operator: ">=",
};

export const LessThanOrEqual = Template.bind({});
LessThanOrEqual.args = {
  keyLabel: "weight",
  value: "70",
  operator: "<=",
};

export const EditableValue = Template.bind({});
EditableValue.args = {
  keyLabel: "score",
  value: "85",
  operator: "=",
};

export const TaxKey = Template.bind({});
TaxKey.args = {
  keyLabel: "tax",
  value: "Eukaryota",
  operator: null,
  modifier: "tree",
  palette: "purple",
};

export const LongTaxKey = Template.bind({});
LongTaxKey.args = {
  keyLabel: "tax",
  value: "9608[Canidae]",
  operator: null,
  modifier: "name",
  palette: "purple",
};

export const LongValue = Template.bind({});
LongValue.args = {
  keyLabel: "bioproject",
  value: "PRJEB40665,PRJEB40666,PRJEB40667,PRJEB40668,PRJEB40669",
  operator: "=",
};

export const WithModifier = Template.bind({});
WithModifier.args = {
  keyLabel: "assembly_span",
  value: "1000000000",
  operator: "<=",
  modifier: "max",
};
