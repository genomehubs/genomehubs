import BasicTextField from "./BasicTextField";
import { Provider } from "react-redux";
import React from "react";
import colorStore from "../reducers/color.store";

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

const themeFromContext = (context) => {
  return context.theme || context.parameters.theme || context.globals.theme;
};

export const Default = (inputArgs, context) => (
  <BasicTextField {...inputArgs} theme={themeFromContext(context)} />
);
