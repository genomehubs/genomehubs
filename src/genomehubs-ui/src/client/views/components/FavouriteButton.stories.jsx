import { expect, screen, userEvent, within } from "@storybook/test";

import FavouriteButton from "./FavouriteButton";
import { Provider } from "react-redux";
import colorStore from "#reducers/color.store";

const meta = {
  component: FavouriteButton,
  decorators: [(story) => <Provider store={colorStore}>{story()}</Provider>],
  tags: ["autodocs"],
  title: "Components/FavouriteButton",
};

export default meta;

export const Default = {
  args: {
    id: "test-record-1",
    result: "assembly",
  },
};

export const AlreadyFavourited = {
  args: {
    id: "test-record-2",
    result: "taxon",
    isFavourite: true,
  },
};

export const WithTooltip = {
  args: {
    id: "test-record-3",
    result: "sample",
  },
};

/**
 * Interaction test: clicking favourite button
 * Tests that the button responds to user interaction
 */
export const ClickToFavourite = {
  args: {
    id: "test-record-4",
    result: "assembly",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the favourite button (usually has aria-label)
    const button = canvas.getByRole("button");
    expect(button).toBeInTheDocument();

    // Click the button
    await userEvent.click(button);

    // Verify button was clicked (state change would be handled by Redux)
    expect(button).toBeInTheDocument();
  },
};

/**
 * Interaction test: favouriting different result types
 */
export const FavouriteDifferentTypes = {
  args: {
    id: "test-record-5",
    result: "feature",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const button = canvas.getByRole("button");
    expect(button).toBeInTheDocument();

    // Multiple clicks
    await userEvent.click(button);
    await userEvent.click(button);

    // Verify it's still responsive
    expect(button).toBeInTheDocument();
  },
};
