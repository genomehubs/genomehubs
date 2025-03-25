/** @type { import('@storybook/react-webpack5').StorybookConfig } */

import MiniCssExtractPlugin from "mini-css-extract-plugin";
import custom from "../webpack.config.js";
import path from "path";

const devMode = true; //process.env.NODE_ENV !== "production";

const config = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],

  addons: [
    "@storybook/addon-webpack5-compiler-swc",
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
    "@storybook/addon-themes",
    "@storybook/addon-interactions",
    "@storybook/preset-scss",
    {
      name: "@storybook/addon-styling-webpack",
      options: {
        plugins: [
          // new MiniCssExtractPlugin({
          //   // filename: devMode ? "css/styles.css" : "css/[name].[contenthash].css",
          //   filename: "css/[name].[contenthash].css",
          //   chunkFilename: "css/[id].css",
          // }),
          new MiniCssExtractPlugin(),
        ],
        rules: [
          // Replaces any existing Sass rules with given rules
          {
            test: /\.css$/,
            use: [
              {
                loader: "style-loader",
                options: { injectType: "singletonStyleTag" },
              },
              {
                loader: "css-loader",
                options: {
                  modules: false,
                },
              },
            ],
            include: [
              /node_modules/,
              path.resolve(
                __dirname,
                "src/client/views/components/style/node_modules.css",
              ),
            ],
          },
          {
            test: /\.(sa|sc|c)ss$/,
            exclude: [
              /node_modules/,
              path.resolve(
                __dirname,
                "/src/client/views/components/style/node_modules.css",
              ),
            ],
            use: [
              MiniCssExtractPlugin.loader,
              {
                loader: "css-loader",
                options: {
                  esModule: true,
                  modules: {
                    localIdentName: "[name]__[local]___[hash:base64:5]",
                    // namedExport: true,
                  },
                  // modules: true,

                  sourceMap: true,
                  importLoaders: 2,
                },
              },
              {
                loader: "postcss-loader",
                options: { implementation: require.resolve("postcss") },
              },
              {
                loader: "sass-loader",
                options: {
                  additionalData: `$directColor: "blue"; \
                  $ancestralColor: "red";\
                  $descendantColor: "purple";`,
                },
              },
            ],
          },
        ],
      },
    },
    "@storybook/addon-mdx-gfm",
  ],

  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },

  babel: async (options) => ({
    ...options,
    plugins: [
      ...options.plugins,
      "babel-plugin-react-docgen",
      "@babel/preset-react",
    ],
  }),

  webpackFinal: async (config) => {
    // Extract test patterns from the custom rules for targeted replacement
    const customTests = custom.module.rules.map((rule) => String(rule.test));
    // Filter out existing rules that match any custom rule test pattern
    const filteredRules = config.module.rules.filter(
      (rule) => !(rule.test && customTests.includes(String(rule.test))),
    );
    return {
      ...config,
      module: {
        ...config.module,
        rules: [...filteredRules, ...custom.module.rules],
      },
    };
  },

  docs: {
    autodocs: true,
  },

  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
};
export default config;
