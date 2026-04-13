//@ts-check
'use strict';

const path = require('path');

/** @type {import('webpack').Configuration} */
const extensionConfig = {
  target: 'node',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
    ],
  },
};

/** @type {import('webpack').Configuration} */
const webviewConfig = {
  target: 'web',
  entry: './src/webview/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'webview.js',
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};

module.exports = [extensionConfig, webviewConfig];
