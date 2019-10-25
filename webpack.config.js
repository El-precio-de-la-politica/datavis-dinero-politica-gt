const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const path = require("path");

module.exports = {
  entry: './src/main.js',
  module: {
    rules: [
      { test: /\.js$/, use: 'babel-loader' },
      { test: /\.vue$/, use: 'vue-loader' },
      { test: /\.css$/, use: ['vue-style-loader', 'css-loader']},
    ]
  },
  optimization: {
       minimizer: [
           new UglifyJSPlugin({
               include: /\.js$/,
               parallel: true,
               sourceMap: true,
               uglifyOptions: {
                   compress: true,
                   ie8: false,
                   ecma: 5,
                   output: {comments: false},
                   warnings: false
               },
               warningsFilter: () => false
           })
       ]
  },

  plugins: [/*
    new webpack.DefinePlugin({
           "typeof CANVAS_RENDERER": JSON.stringify(true),
           "typeof WEBGL_RENDERER": JSON.stringify(true),
           "typeof EXPERIMENTAL": JSON.stringify(false),
           "typeof PLUGIN_CAMERA3D": JSON.stringify(false),
           "typeof PLUGIN_FBINSTANT": JSON.stringify(false)
    }),*/

    new CleanWebpackPlugin([ 'dist' ]),
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    new VueLoaderPlugin(),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'public')
  }
};
