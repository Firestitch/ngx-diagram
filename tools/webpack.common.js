const { webpack_css_inline_loaders, webpack_scss_inline_loaders } = require('./loaders');

const webpack = require('webpack');
const { srcRoot, dir, METADATA } = require('./helpers');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const DirectoryTreePlugin = require('directory-tree-webpack-plugin');

module.exports = function() {
  return {
    context: srcRoot,
    resolve: {
      extensions: ['.ts', '.js', '.json', '.css', '.scss', '.html'],
      modules: [
        'node_modules',
        dir('src'),
      ]
    },
    performance: {
      hints: false
    },
    output: {
      filename: '[name].js',
      sourceMapFilename: '[name].map',
      chunkFilename: '[id].chunk.js',

    publicPath: '',
    },
    module: {
      exprContextCritical: false,
      rules: [
        {
          test: /\.(png|woff|woff2|eot|ttf|svg|jpeg|jpg|gif)$/,
          loader: 'url-loader',
          query: {
            limit: '100000'
          }
        },
        {
          test: /\.html$/,
          loader: 'raw-loader'
        },
        {
          test: /\.css$/,
          include: [
            dir('src'),
            dir('playground/app'),
            dir('playground/assets')
          ],
          exclude: [
            dir('src/styles')
          ],
          use: webpack_css_inline_loaders
        },
        {
          test: /\.scss$/,
          include: [
            dir('src'),
            dir('playground/app'),
            dir('playground/assets')
          ],
          exclude: [
            dir('src/styles')
          ],
          use: webpack_scss_inline_loaders
        },
      ]
    },
    plugins: [
      new ExtractTextPlugin('styles/[name].css'),
      new webpack.NamedModulesPlugin(),
      new webpack.DefinePlugin({
        PRODUCTION: METADATA.isProd
      }),
      new CopyWebpackPlugin([
        { from: dir('src/assets'), to: 'assets' }
      ]),
    ]
  };
};
