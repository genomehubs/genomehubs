import BasicTextField from "./BasicTextField";
import { Provider } from "react-redux";
import React from "react";
import colorStore from "#reducers/color.store";
import { themeFromContext } from "#storybook/functions/themeFromContext";

const meta = {
  decorators: [(story) => <Provider store={colorStore}>{story()}</Provider>],
  component: BasicTextField,
  tags: ["autodocs"],
  args: {
    id: "text-field",
    label: "Text field",
  },
};

export default meta;

export const Default = (inputArgs, context) => (
  <BasicTextField {...inputArgs} theme={themeFromContext(context)} />
);
