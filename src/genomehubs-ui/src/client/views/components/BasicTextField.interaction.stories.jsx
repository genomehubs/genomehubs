import { expect, userEvent, within } from "@storybook/test";

import BasicTextField from "./BasicTextField";

const meta = {
  component: BasicTextField,
  tags: ["autodocs"],
  title: "Form/BasicTextField",
};

export default meta;

export const Default = {
  args: {
    id: "basic-text-field",
    label: "Text Field",
    placeholder: "Enter text...",
  },
};

export const WithValue = {
  args: {
    id: "text-with-value",
    label: "Input Field",
    value: "Sample text",
  },
};

export const WithError = {
  args: {
    id: "text-error",
    label: "Error Field",
    error: true,
    helperText: "This field has an error",
  },
};

export const Disabled = {
  args: {
    id: "disabled-text",
    label: "Disabled Field",
    disabled: true,
    value: "Disabled text",
  },
};

/**
 * User interaction test: typing into the text field
 */
export const UserInputInteraction = {
  args: {
    id: "user-input-test",
    label: "Search",
    placeholder: "Type to search...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the input field
    const input = canvas.getByRole("textbox", { name: /Search/i });
    expect(input).toBeInTheDocument();

    // Verify it's empty initially
    expect(input).toHaveValue("");

    // Simulate user typing
    await userEvent.type(input, "Homo sapiens");

    // Verify the value was entered
    expect(input).toHaveValue("Homo sapiens");
  },
};

/**
 * User interaction test: clearing the field
 */
export const ClearFieldInteraction = {
  args: {
    id: "clear-test",
    label: "Input",
    value: "Initial value",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const input = canvas.getByRole("textbox", { name: /Input/i });

    // Verify initial value
    expect(input).toHaveValue("Initial value");

    // Clear the field
    await userEvent.clear(input);

    // Verify it's empty
    expect(input).toHaveValue("");
  },
};

/**
 * User interaction test: multiline input
 */
export const MultilineInput = {
  args: {
    id: "multiline-test",
    label: "Comments",
    multiline: true,
    rows: 4,
    placeholder: "Enter multiple lines...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const textarea = canvas.getByRole("textbox", { name: /Comments/i });
    expect(textarea).toBeInTheDocument();

    // Type multiline content
    await userEvent.type(textarea, "Line 1{Enter}Line 2{Enter}Line 3");

    // Verify multiline content
    expect(textarea).toHaveValue("Line 1\nLine 2\nLine 3");
  },
};
