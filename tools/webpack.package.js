const webpack_scss_inline_loaders = require('./loaders').webpack_scss_inline_loaders;

const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.common');
const { srcRoot, dir, pkgName } = require('./helpers');
const { CheckerPlugin } = require('awesome-typescript-loader');

module.exports = function() {
  return webpackMerge(commonConfig(), {
    context: srcRoot,
    devtool: 'source-map',
    resolve: {
      extensions: ['.ts', '.js', '.json', '.css', '.scss', '.html'],
      modules: [
        'node_modules',
        dir('src'),
      ]
    },
    module: {
      exprContextCritical: false,
      rules: [
        {
          test: /\.ts$/,
          loaders: [
            'awesome-typescript-loader',
            'angular2-template-loader'
          ],
          exclude: [/\.(spec|e2e|d)\.ts$/]
        },
        {
          test: /\.scss$/,
          include: [
            dir('src/styles.scss')
          ],
          use: webpack_scss_inline_loaders
        }
      ]
    },
    entry: {
      'index': './index.ts'
    },
    output: {
      path: dir('package'),
      libraryTarget: 'umd',
      library: pkgName,
      umdNamedDefine: true
    },
    externals: [nodeExternals()],
    plugins: [
      new webpack.optimize.ModuleConcatenationPlugin(),
      new CheckerPlugin(),
    ]
  });

};
