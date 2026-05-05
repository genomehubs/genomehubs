import { expect, within } from "@storybook/test";

import BadgeStats from "./BadgeStats";

const meta = {
  component: BadgeStats,
  tags: ["autodocs"],
  title: "Display/BadgeStats",
};

export default meta;

export const SingleStat = {
  args: {
    stat: "count",
    value: 42,
    label: "Records",
  },
};

export const LargeStat = {
  args: {
    stat: "total",
    value: 1000000,
    label: "Total genomes",
  },
};

export const SmallStat = {
  args: {
    stat: "active",
    value: 7,
    label: "Active",
  },
};

export const WithPercentage = {
  args: {
    stat: "percentage",
    value: 85.5,
    label: "Complete",
  },
};

/**
 * Interaction test: rendering stat badge
 * Tests that the badge displays the correct information
 */
export const RenderingTest = {
  args: {
    stat: "assemblies",
    value: 256,
    label: "Assemblies",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the value is rendered
    const valueElement = canvas.getByText(/256/);
    expect(valueElement).toBeInTheDocument();

    // Verify the label is rendered
    const labelElement = canvas.getByText(/Assemblies/);
    expect(labelElement).toBeInTheDocument();
  },
};

/**
 * Interaction test: zero value
 */
export const ZeroValue = {
  args: {
    stat: "count",
    value: 0,
    label: "Results",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const valueElement = canvas.getByText(/0/);
    expect(valueElement).toBeInTheDocument();
  },
};

/**
 * Interaction test: rendering with complex label
 */
export const ComplexLabel = {
  args: {
    stat: "reference",
    value: 5432,
    label: "Reference assemblies",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify both parts of the label render
    const element = canvas.getByText(/Reference assemblies/);
    expect(element).toBeInTheDocument();

    const value = canvas.getByText(/5432/);
    expect(value).toBeInTheDocument();
  },
};
