const webpackMerge = require('webpack-merge');
const DirectoryTreePlugin = require('directory-tree-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const { dir } = require('./helpers');

const ENV = 'development';

let playgroundConfig = require('./webpack.playground.js');

module.exports = function() {

  return webpackMerge(playgroundConfig(), {

    context: dir('playground'),

    entry: {
      polyfills: './polyfills.ts',
      main: './main.ts'
    },

    output: {
      path: dir('demo'),
      filename: '[name].js',
      sourceMapFilename: '[name].map',
      chunkFilename: '[id].chunk.js'
    },

    devtool: 'source-map',

    resolve: {
      mainFields: [ 'es2015', 'browser', 'module', 'main' ],
      extensions: ['.ts', '.js', '.scss'],
      modules: ['node_modules']
    },

    module: {
    },
    plugins: [
      new DirectoryTreePlugin({
        dir: './playground/app/components',
        path: './playground/assets/components/components.json',
        enhance: (item, options) => {
          item.path = item.path.replace(/playground(\\|\/)app(\\|\/)components(\\|\/)/, '');
          return item;
        }
      }),
      new FileManagerPlugin({
        onEnd: [
          {
            copy: [
              { source: "./playground/app/components", destination: "./demo/assets/components" },
              { source: "./playground/assets/components/components.json", destination: "./demo/assets/components" },
              { source: "./config.xml*", destination: "./demo" },
              { source: "./tools/assets/app", destination: "./demo/assets/app" }
            ],
            move: [
              { source: "./docs", destination: "./demo/docs" }
            ]
          }
        ]
      })
    ]
  })
};
