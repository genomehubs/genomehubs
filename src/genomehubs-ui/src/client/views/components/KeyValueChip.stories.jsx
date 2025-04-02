import React, { useState } from "react";

import KeyValueChip from "./KeyValueChip";

export default {
  title: "Components/KeyValueChip",
  component: KeyValueChip,
  argTypes: {
    keyLabel: { control: "text" },
    value: { control: "text" },
    symbol: { control: { type: "select", options: ["=", ">=", "<="] } },
    onChange: { action: "onChange" },
  },
};

const Template = (args) => {
  const [chipData, setChipData] = useState({
    key: args.keyLabel,
    value: args.value,
    symbol: args.symbol,
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
  symbol: "tree",
};

export const LongValue = Template.bind({});
LongValue.args = {
  keyLabel: "bioproject",
  value: "PRJEB40665,PRJEB40666,PRJEB40667,PRJEB40668,PRJEB40669",
  symbol: "=",
};
