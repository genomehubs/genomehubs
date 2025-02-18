import * as PalettePreviewStories from "./PalettePreview.stories";

import { Provider } from "react-redux";
import React from "react";
import Tooltip from "./Tooltip";
import colorStore from "../reducers/color.store";

const meta = {
  component: Tooltip,
  // title: "Tooltip",
  decorators: [(story) => <Provider store={colorStore}>{story()}</Provider>],
  tags: ["autodocs"],
  // excludeStories: /.*MockedState$/,
  args: {
    theme: "light",
    title: "Tooltip",
  },
};

export default meta;

const themeFromContext = (context) => {
  return context.theme || context.parameters.theme || context.globals.theme;
};

const StyledElement = (
  <div style={{ height: "2em", width: "2em", backgroundColor: "red" }}></div>
);

export const Default = (inputArgs, context) => (
  <Tooltip {...inputArgs} theme={themeFromContext(context)}>
    {StyledElement}
  </Tooltip>
);

// export const Wide = (inputArgs, context) => {
//   let args = { ...inputArgs, swatches: 10, theme: themeFromContext(context) };
//   return <PalettePicker {...args} />;
// };
