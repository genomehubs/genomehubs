const path = require("path");
const webpack = require("webpack");
const PACKAGE = require("./package.json");
const main = require("./src/config/main");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { GitRevisionPlugin } = require("git-revision-webpack-plugin");
// const GitRevisionPlugin = require("git-revision-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

const devMode = process.env.NODE_ENV !== "production";

const { commitHash } = main;

const BUILD_DIR = path.resolve(__dirname, `dist/public/`);
const STATIC_DIR = commitHash
  ? path.resolve(__dirname, `dist/public/static/${commitHash}`)
  : path.resolve(__dirname, `dist/public/static/[fullhash]`);
const APP_DIR = path.resolve(__dirname, "src/client/views");

const gitRevisionPlugin = new GitRevisionPlugin();

// Safe git info retrieval for non-git environments (Docker builds)
let gitBranch = "unknown";
let gitVersion = "unknown";
try {
  gitBranch = gitRevisionPlugin.branch();
  gitVersion = gitRevisionPlugin.version();
} catch (err) {
  console.warn("Git info unavailable (not a git repository):", err.message);
}

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
    chunkFilename: "js/[name].[contenthash].js",
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      minSize: 10000,
      maxAsyncRequests: 30,
      maxInitialRequests: 10,
      cacheGroups: {
        // Export/download libraries (lazy loaded only when exporting)
        export: {
          test: /[\\/]node_modules[\\/](html-to-image|jszip|qrcode\.react|merge-images)[\\/]/,
          name: "export",
          chunks: "async",
          priority: 30,
          reuseExistingChunk: true,
        },
        // Three.js and react-globe.gl (lazy loaded only for globe view)
        three: {
          test: /[\\/]node_modules[\\/](three|react-globe\.gl)[\\/]/,
          name: "three",
          chunks: "async",
          priority: 40,
          enforce: true,
        },
        // Proj4 (used with map projections)
        proj4: {
          test: /[\\/]node_modules[\\/]proj4[\\/]/,
          name: "proj4",
          chunks: "all",
          priority: 35,
          enforce: true,
        },
        // H3 geospatial indexing (if used)
        h3: {
          test: /[\\/]node_modules[\\/]h3-js[\\/]/,
          name: "h3",
          chunks: "all",
          priority: 35,
          enforce: true,
        },
        // JS-YAML parser
        yaml: {
          test: /[\\/]node_modules[\\/]js-yaml[\\/]/,
          name: "yaml",
          chunks: "all",
          priority: 35,
          enforce: true,
        },
        // Drag and drop library
        dnd: {
          test: /[\\/]node_modules[\\/]@hello-pangea[\\/]dnd[\\/]/,
          name: "dnd",
          chunks: "all",
          priority: 35,
          enforce: true,
        },
        // Leaflet (lazy loaded only for map reports)
        leaflet: {
          test: /[\\/]node_modules[\\/](leaflet|react-leaflet|proj4leaflet)[\\/]/,
          name: "leaflet",
          chunks: "all",
          priority: 35,
          enforce: true,
        },
        // Recharts (lazy loaded only for chart reports)
        recharts: {
          test: /[\\/]node_modules[\\/]recharts[\\/]/,
          name: "recharts",
          chunks: "all",
          priority: 35,
          enforce: true,
        },
        // Konva (lazy loaded only for canvas visualizations)
        konva: {
          test: /[\\/]node_modules[\\/](konva|react-konva)[\\/]/,
          name: "konva",
          chunks: "all",
          priority: 35,
          enforce: true,
        },
        // MUI core (used by most pages)
        mui: {
          test: /[\\/]node_modules[\\/]@mui[\\/]/,
          name: "mui",
          priority: 20,
          reuseExistingChunk: true,
        }, // Syntax highlighting (lazy loaded only for code blocks)
        syntaxHighlighter: {
          test: /[\/]node_modules[\/]react-syntax-highlighter[\/]/,
          name: "syntax-highlighter",
          chunks: "async",
          priority: 20,
          reuseExistingChunk: true,
        },
        // Markdown processing libraries (for content panels)
        markdown: {
          test: /[\/]node_modules[\/](remark-|rehype-|unified|unist-)[\/]/,
          name: "markdown",
          chunks: "async",
          priority: 15,
          reuseExistingChunk: true,
        }, // D3 libraries (only for charts/reports)
        d3: {
          test: /[\\/]node_modules[\\/]d3(-\w+)?[\\/]/,
          name: "d3",
          chunks: "async",
          priority: 15,
          reuseExistingChunk: true,
        },
        // Vendor libraries that are used across many pages
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          priority: 10,
          reuseExistingChunk: true,
        },
        // Common utilities used in multiple places
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
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
    new BundleAnalyzerPlugin({
      analyzerMode: process.env.ANALYZE ? "server" : "disabled",
      openAnalyzer: true,
    }),
    new MiniCssExtractPlugin({
      // filename: devMode ? "css/styles.css" : "css/[name].[contenthash].css",
      filename: "css/[name].[contenthash].css",
      chunkFilename: "css/[id].css",
    }),
    new webpack.DefinePlugin({
      API_URL: JSON.stringify(main.apiUrl),
      ARCHIVE: JSON.stringify(main.archive),
      BASENAME: JSON.stringify(main.basename),
      BRANCH: JSON.stringify(gitBranch),
      COMMIT_HASH: JSON.stringify(commitHash),
      PAGES_URL: JSON.stringify(main.basename + main.pagesUrl),
      COOKIE_BANNER: JSON.stringify(main.cookies),
      DEFAULT_INDEX: JSON.stringify(main.defaultIndex),
      GA_ID: JSON.stringify(main.ga_id),
      GDPR_URL: JSON.stringify(main.gdpr_url),
      GIT_VERSION: JSON.stringify(gitVersion),
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
        test: /\.geojson$/,
        type: "json",
      },
    ],
  },
};

module.exports = config;
