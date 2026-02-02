import { userEvent, within } from "@storybook/testing-library";

import AutowidthTextField from "./AutowidthTextField";
import { useState } from "react";

export default {
  title: "Components/AutowidthTextField",
  component: AutowidthTextField,
  argTypes: {
    padding: { control: "number" },
    minWidth: { control: "number" },
    maxWidth: { control: "number" },
  },
};

const Template = (args) => {
  const [value, setValue] = useState("");

  const handleChange = (newValue) => {
    setValue(newValue);
  };

  return (
    <AutowidthTextField
      {...args}
      value={value}
      handleChange={handleChange}
      placeholder="Type here..."
    />
  );
};

export const Default = Template.bind({});
Default.args = {
  padding: 16,
  minWidth: 100,
  maxWidth: 200,
};

export const SmallPadding = Template.bind({});
SmallPadding.args = {
  padding: 8,
  minWidth: 100,
  maxWidth: 200,
};

export const LargePadding = Template.bind({});
LargePadding.args = {
  padding: 32,
  minWidth: 100,
  maxWidth: 200,
};

export const ShortMinLength = Template.bind({});
ShortMinLength.args = {
  padding: 16,
  minWidth: 20,
  maxWidth: 200,
};

export const LongMaxLength = Template.bind({});
LongMaxLength.args = {
  padding: 16,
  minWidth: 100,
  maxWidth: 1000,
};

export const TypingTest = Template.bind({});
TypingTest.args = {
  padding: 16,
  minWidth: 100,
  maxWidth: 200,
};
TypingTest.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const input = canvas.getByPlaceholderText("Type here...");

  // Simulate typing
  await userEvent.type(input, "Hello, World!", { delay: 100 });

  // Simulate deleting
  for (let i = 0; i < 5; i++) {
    await userEvent.type(input, "{backspace}");
  }
};
