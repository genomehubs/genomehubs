import React, { useState } from "react";

import KeyValueChip from "./KeyValueChip";
import { Provider } from "react-redux";
import colorStore from "#reducers/color.store";
import types from "./default.types.json";

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
      palette={chipData.palette}
      types={args.types}
      onChange={handleChipChange}
    />
  );
};

export const Default = Template.bind({});
Default.args = {
  types,
};

export const GreaterThanOrEqual = Template.bind({});
GreaterThanOrEqual.args = {
  ...Default.args,
  keyLabel: "assembly_span",
  value: "2000000000",
  operator: ">=",
};

export const LessThanOrEqual = Template.bind({});
LessThanOrEqual.args = {
  ...Default.args,
  keyLabel: "assembly_level",
  value: "scaffold",
  operator: "<=",
};

export const TaxKey = Template.bind({});
TaxKey.args = {
  ...Default.args,
  keyLabel: "tax",
  value: "Eukaryota",
  operator: null,
  modifier: "tree",
  palette: "purple",
};

export const LongTaxKey = Template.bind({});
LongTaxKey.args = {
  ...Default.args,
  keyLabel: "tax",
  value: "9608[Canidae]",
  operator: null,
  modifier: "name",
  palette: "purple",
};

export const LongValue = Template.bind({});
LongValue.args = {
  ...Default.args,
  keyLabel: "bioproject",
  value: "PRJEB40665,PRJEB40666,PRJEB40667,PRJEB40668,PRJEB40669",
  operator: "=",
};

export const VeryLongValue = Template.bind({});
VeryLongValue.args = {
  ...Default.args,
  keyLabel: "bioproject",
  operator: "=",
  modifier: "value",
  value:
    "PRJEB40655,PRJEB40656,PRJEB40657,PRJEB40658,PRJEB40659,PRJEB40660,PRJEB40661,PRJEB40662,PRJEB40663,PRJEB40664,PRJEB40665,PRJEB40666,PRJEB40667,PRJEB40668,PRJEB40669,PRJEB40670,PRJEB40671,PRJEB40672,PRJEB40673,PRJEB40674,PRJEB40675,PRJEB40676,PRJEB40677,PRJEB40678,PRJEB40679,PRJEB40680,PRJEB40681,PRJEB40682,PRJEB40683,PRJEB40684,PRJEB40685,PRJEB40686,PRJEB40687,PRJEB40688,PRJEB40689,PRJEB40690,PRJEB40691,PRJEB40692,PRJEB40693,PRJEB40694,PRJEB40695,PRJEB40696,PRJEB40697,PRJEB40698,PRJEB40699,PRJEB40700,PRJEB40701,PRJEB40702,PRJEB40703,PRJEB40704,PRJEB40705,PRJEB40706,PRJEB40707,PRJEB40708,PRJEB40709,PRJEB40710,PRJEB40711,PRJEB40712,PRJEB40713,PRJEB40714,PRJEB40715",
};

export const SingleLongValue = Template.bind({});
SingleLongValue.args = {
  ...Default.args,
  keyLabel: "bioproject",
  operator: "=",
  modifier: "value",
  value:
    "A very long value that exceeds the normal length without any commas - And by very long I mean it is really very long indeed and should be handled properly by the component.,also,show,some,short,values",
};

export const WithModifier = Template.bind({});
WithModifier.args = {
  ...Default.args,
  keyLabel: "assembly_span",
  value: "1000000000",
  operator: "<=",
  modifier: "max",
};
