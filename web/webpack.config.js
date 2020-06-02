const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
// const combineLoaders = require('webpack-combine-loaders');
const main = require('./src/config/main');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const devMode = process.env.NODE_ENV !== 'production';

const BUILD_DIR = path.resolve(__dirname, 'dist/public');
const APP_DIR = path.resolve(__dirname, 'src/client/views');

const gitRevisionPlugin = new GitRevisionPlugin();

const protocol = main.https ? 'https' : 'http'
const API_PORT = main.https ? 'https' : 'http'

const config = {
  entry: {
    main: ['@babel/polyfill', APP_DIR + '/index.jsx']
  },
  output: {
      publicPath: main.mode == 'production' ? main.basename + '/' : '/',
      path: BUILD_DIR + '/',
      filename: devMode ? 'js/bundle.js' : 'js/[name].[hash].js',
      chunkFilename: 'js/[id].js',
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            return `npm.${packageName.replace('@', '')}`;
          },
        },
      }
    }
  },
  devServer: {
    hot: true,
    historyApiFallback: true,
    host: main.hostname,
    disableHostCheck: main.disableHostCheck,
    contentBase: BUILD_DIR,
    compress: true,
    port: main.client_port,
    proxy: {
      '/api/**': { target: main.apiUrl }
    }
  },
  devtool: 'source-map',
  plugins: [
    new MiniCssExtractPlugin({
      filename: devMode ? 'css/styles.css' : 'css/[name].[hash].css',
      chunkFilename: 'css/[id].css'
    }),
    new webpack.DefinePlugin({
      API_URL: JSON.stringify(main.apiUrl),
    	VERSION: JSON.stringify(main.version),
    	BASENAME: JSON.stringify(main.basename),
      HOME: JSON.stringify(protocol+'://'+main.hostname),
      GIT_VERSION: JSON.stringify(gitRevisionPlugin.version()),
      COMMIT_HASH: JSON.stringify(gitRevisionPlugin.commithash()),
      BRANCH: JSON.stringify(gitRevisionPlugin.branch()),
      GA_ID: JSON.stringify(main.ga_id),
      GDPR_URL: JSON.stringify(main.gdpr_url),
      MESSAGE: JSON.stringify(main.message)
    }),
    new HtmlWebpackPlugin({
      hash: true,
      title: 'GenomeHubs - Web',
      template: './src/client/index.html'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: './src/client/favicon'
        }
      ]
    })
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        include: APP_DIR,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.html$/,
        include: APP_DIR,
        use: [
          {
            loader: "html-loader"
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
            options: { injectType: 'singletonStyleTag' }
          },
          {
            loader: 'css-loader',
            options: {
              modules: false
            }
          }
        ],
        include: [
          /node_modules/,
          path.resolve(__dirname, 'src/client/views/style/node_modules.css')
        ]
      },
      {
        test: /\.(sa|sc|c)ss$/,
        exclude: [
          /node_modules/,
          path.resolve(__dirname, '/src/client/views/components/style/node_modules.css')
        ],
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            query: {
              modules: {
	              localIdentName: "[name]__[local]___[hash:base64:5]",
	            },
	            sourceMap: true,
              importLoaders: 2
            }
          },
          'postcss-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.svg$/,
        use: [
          'svg-sprite-loader',
          'svgo-loader'
        ]
      },
      {
        test: /\.(gif|png|jpe?g)$/i,
        loader: 'file-loader',
        options: {
          name: 'img/[hash].[ext]',
          publicPath: main.mode == 'production' ? main.basename + '/' :'/'
        }
      }
    ]
  }
};

module.exports = config;
