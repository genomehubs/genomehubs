const path = require("path");
const webpack = require("webpack");
const PACKAGE = require("./package.json");
const main = require("./src/config/main");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { GitRevisionPlugin } = require("git-revision-webpack-plugin");
// const GitRevisionPlugin = require("git-revision-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const devMode = process.env.NODE_ENV !== "production";

const { commitHash } = main;

const BUILD_DIR = path.resolve(__dirname, `dist/public/`);
const STATIC_DIR = commitHash
  ? path.resolve(__dirname, `dist/public/static/${commitHash}`)
  : path.resolve(__dirname, `dist/public/static/[fullhash]`);
const APP_DIR = path.resolve(__dirname, "src/client/views");

const gitRevisionPlugin = new GitRevisionPlugin();

const protocol = main.https ? "https" : "http";

const config = {
  mode: devMode ? "development" : "production",
  entry: {
    main: [APP_DIR + "/index.jsx"],
  },
  output: {
    publicPath:
      main.mode == "production" ? main.basename + "/" : main.basename + "/",
    path: BUILD_DIR + "/",
    // filename: devMode ? "js/bundle.js" : "js/[name].[contenthash].js",
    filename: "js/[name].[contenthash].js",
    chunkFilename: "js/[id].js",
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      // maxInitialRequests: Infinity,
      // minSize: 50000,
      // cacheGroups: {
      //   defaultVendors: {
      //     test: /[\\/]node_modules[\\/]/,
      //     name(module) {
      //       const packageName = module.context.match(
      //         /[\\/]node_modules[\\/](.*?)([\\/]|$)/
      //       );
      //       if (packageName) {
      //         return `npm.${packageName[1].replace("@", "")}`;
      //       }
      //     },
      //     chunks: "all",
      //   },
      // },
    },
  },
  devServer: {
    hot: false,
    historyApiFallback: true,
    host: main.hostname,
    allowedHosts: "all",
    static: {
      directory: BUILD_DIR,
      publicPath: main.basename,
    },
    compress: true,
    port: main.client_port,
    // proxy: {
    //   "/api/**": { target: main.apiUrl },
    // },
  },
  devtool: "source-map",
  plugins: [
    new MiniCssExtractPlugin({
      // filename: devMode ? "css/styles.css" : "css/[name].[contenthash].css",
      filename: "css/[name].[contenthash].css",
      chunkFilename: "css/[id].css",
    }),
    new webpack.DefinePlugin({
      API_URL: JSON.stringify(main.apiUrl),
      ARCHIVE: JSON.stringify(main.archive),
      BASENAME: JSON.stringify(main.basename),
      BRANCH: JSON.stringify(gitRevisionPlugin.branch()),
      COMMIT_HASH: JSON.stringify(commitHash),
      PAGES_URL: JSON.stringify(main.basename + main.pagesUrl),
      COOKIE_BANNER: JSON.stringify(main.cookies),
      DEFAULT_INDEX: JSON.stringify(main.defaultIndex),
      GA_ID: JSON.stringify(main.ga_id),
      GDPR_URL: JSON.stringify(main.gdpr_url),
      GIT_VERSION: JSON.stringify(gitRevisionPlugin.version()),
      HOME: JSON.stringify(protocol + "://" + main.hostname),
      MESSAGE: JSON.stringify(main.message),
      TAXONOMY: JSON.stringify(main.taxonomy),
      SITENAME: JSON.stringify(main.siteName),
      VERSION: JSON.stringify(PACKAGE.version),
      SUGGESTED_TERM: JSON.stringify(main.suggestedTerm),
      TREE_THRESHOLD: JSON.stringify(main.treeThreshold),
      MAP_THRESHOLD: JSON.stringify(main.mapThreshold),
      DIRECT_COLOR: JSON.stringify(main.directColor),
      DESCENDANT_COLOR: JSON.stringify(main.descendantColor),
      ANCESTRAL_COLOR: JSON.stringify(main.ancestralColor),
      DIRECT_HIGHLIGHT: JSON.stringify(main.directHighlight),
      DESCENDANT_HIGHLIGHT: JSON.stringify(main.descendantHighlight),
    }),
    new HtmlWebpackPlugin({
      hash: true,
      template: "./src/client/index.html",
      minify: {
        collapseInlineTagWhitespace: true,
        collapseWhitespace: true,
        preserveLineBreaks: true,
        minifyURLs: true,
        removeComments: false,
        removeAttributeQuotes: true,
      },
    }),
    // new webpack.ExtendedAPIPlugin(),
  ].concat(
    main.pagesUrl.startsWith("http")
      ? []
      : [
          new CopyWebpackPlugin({
            patterns: [
              {
                from: "./src/client/favicon",
              },
              {
                from: main.pagesPath,
                to({ context, absoluteFilename }) {
                  return path.join(
                    STATIC_DIR,
                    path.relative(context, absoluteFilename),
                  );
                },
              },
            ],
          }),
        ],
  ),
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        include: APP_DIR,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.html$/,
        include: APP_DIR,
        use: [
          {
            loader: "html-loader",
            options: {
              minimize: {
                removeComments: false,
                collapseWhitespace: true,
              },
            },
          },
        ],
      },
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
          devMode ? MiniCssExtractPlugin.loader : "style-loader",
          {
            loader: "css-loader",
            options: {
              esModule: true,
              modules: {
                localIdentName: "[name]__[local]___[hash:base64:5]",
                namedExport: true,
              },
              sourceMap: true,
              importLoaders: 2,
            },
          },
          "postcss-loader",
          {
            loader: "sass-loader",
            options: {
              additionalData: `$directColor: ${main.directColor}; \
$ancestralColor: ${main.ancestralColor};\
$descendantColor: ${main.descendantColor};`,
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        use: ["svg-sprite-loader", "svgo-loader"],
      },
      {
        test: /\.(gif|png|jpe?g)$/i,
        loader: "file-loader",
        options: {
          name: "img/[contenthash].[ext]",
          publicPath:
            main.mode == "production"
              ? main.basename + "/"
              : main.basename + "/",
        },
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        // use: [
        //   {
        //     loader: "file-loader",
        //     options: {
        //       name: "fonts/[contenthash].[ext]",
        //       publicPath: main.mode == "production" ? main.basename + "/" : "/",
        //     },
        //   },
        // ],
        type: "asset/resource",
      },
    ],
  },
};

module.exports = config;
