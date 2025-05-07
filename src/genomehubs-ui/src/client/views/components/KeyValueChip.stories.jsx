import React, { useState } from "react";

import KeyValueChip from "./KeyValueChip";

export default {
  title: "Components/KeyValueChip",
  component: KeyValueChip,
  argTypes: {
    keyLabel: { control: "text" },
    value: { control: "text" },
    symbol: { control: { type: "select", options: ["=", ">=", "<="] } },
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
    symbol: args.symbol,
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
      symbol={chipData.symbol}
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
  symbol: "=",
};

export const GreaterThanOrEqual = Template.bind({});
GreaterThanOrEqual.args = {
  keyLabel: "height",
  value: "180",
  symbol: ">=",
};

export const LessThanOrEqual = Template.bind({});
LessThanOrEqual.args = {
  keyLabel: "weight",
  value: "70",
  symbol: "<=",
};

export const EditableValue = Template.bind({});
EditableValue.args = {
  keyLabel: "score",
  value: "85",
  symbol: "=",
};

export const TaxKey = Template.bind({});
TaxKey.args = {
  keyLabel: "tax",
  value: "Eukaryota",
  symbol: null,
  modifier: "tree",
  palette: "purple",
};

export const LongTaxKey = Template.bind({});
LongTaxKey.args = {
  keyLabel: "tax",
  value: "9608[Canidae]",
  symbol: null,
  modifier: "name",
  palette: "purple",
};

export const LongValue = Template.bind({});
LongValue.args = {
  keyLabel: "bioproject",
  value: "PRJEB40665,PRJEB40666,PRJEB40667,PRJEB40668,PRJEB40669",
  symbol: "=",
};

export const WithModifier = Template.bind({});
WithModifier.args = {
  keyLabel: "assembly_span",
  value: "1000000000",
  symbol: "<=",
  modifier: "max",
};
