import { expect, screen, within } from "@storybook/test";

import Count from "./Count";

const meta = {
  component: Count,
  tags: ["autodocs"],
  title: "Utilities/Count",
};

export default meta;

export const SmallNumber = {
  args: {
    value: 42,
  },
};

export const LargeNumber = {
  args: {
    value: 1234567,
  },
};

export const WithLabel = {
  args: {
    value: 9876,
    label: "total items",
  },
};

export const InteractionTest = {
  args: {
    value: 5000,
    label: "records",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the count is rendered
    const countElement = canvas.getByText(/5/);
    expect(countElement).toBeInTheDocument();
  },
};

export const ZeroValue = {
  args: {
    value: 0,
  },
};

export const NegativeValue = {
  args: {
    value: -100,
  },
};
