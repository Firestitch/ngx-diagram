var ZipPlugin = require('zip-webpack-plugin');
const webpackMerge = require('webpack-merge');
const demoConfig = require('./webpack.demo.js');
const { dir } = require('./helpers');

module.exports = function() {

  return webpackMerge(demoConfig(), 
    {

        plugins: [
            new ZipPlugin({
            // OPTIONAL: defaults to the Webpack output path (above)
            // can be relative (to Webpack output path) or absolute
            path: dir('demo'),
        
            // OPTIONAL: defaults to the Webpack output filename (above) or,
            // if not present, the basename of the path
            filename: 'demo.zip',
        
        
            // OPTIONAL: defaults to including everything
            // can be a string, a RegExp, or an array of strings and RegExps
            include: [/\.*$/],


            })
        ]
    });
}