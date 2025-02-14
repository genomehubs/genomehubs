/** @type { import('@storybook/react-webpack5').StorybookConfig } */

import custom from "../webpack.config.js";

const config = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-webpack5-compiler-swc",
    "@storybook/addon-onboarding",
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  babel: async (options) => ({
    ...options,
    plugins: [...options.plugins, "babel-plugin-react-docgen"],
  }),
  webpackFinal: async (config) => {
    return {
      ...config,
      module: {
        ...config.module,
        rules: [...config.module.rules, ...custom.module.rules],
      },
    };
  },
};
export default config;
