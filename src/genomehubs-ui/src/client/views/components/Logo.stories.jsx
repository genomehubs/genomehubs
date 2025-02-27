import Logo from "./Logo";
import { Provider } from "react-redux";
import React from "react";
import colorStore from "../reducers/color.store";
import { themeFromContext } from "../../../../.storybook/functions/themeFromContext";

const meta = {
  component: Logo,
  decorators: [(story) => <Provider store={colorStore}>{story()}</Provider>],
  tags: ["autodocs"],
  args: { theme: "darkTheme" },
};

export default meta;

export const BackgroundContrast = (inputArgs, context) => {
  let args = {
    ...inputArgs,
    backgroundColor: "contrast",
    theme: themeFromContext(context),
  };
  return <Logo {...args} />;
};

export const BackgroundColor = (inputArgs, context) => {
  let args = {
    ...inputArgs,
    backgroundColor: "#ff7001",
    theme: themeFromContext(context),
  };
  return <Logo {...args} />;
};

export const Invert = (inputArgs, context) => {
  let args = { ...inputArgs, invert: true, theme: themeFromContext(context) };
  return <Logo {...args} />;
};

export const LineColor = (inputArgs, context) => {
  let args = {
    ...inputArgs,
    lineColor: "#ff7001",
    theme: themeFromContext(context),
  };
  return <Logo {...args} />;
};
