const path = require('path');
// const htmlPlugin = require('html-webpack-plugin');
// const cleanPlugin = require('clean-webpack-plugin');
// const ErrorOverlayPlugin = require('error-overlay-webpack-plugin')

let config = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'js/bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
  // plugins: [new ErrorOverlayPlugin()],
};

const devConfig = {
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    // Display only errors to reduce the amount of output.
    // stats: "errors-only",

    host: '0.0.0.0',
    port: 8080,
    open: true, // Open the page in browser
    allowedHosts: [
        '.linux.test'
    ],
    overlay: true,
    contentBase: 'public',
  },
  watch: true,
};

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    config = {...config, ...devConfig};
  } else {
    config.mode = 'production';
  }
  if (env && env.sw) {
    config.entry = './sw-src/service-worker.ts',
    config.output = {
      filename: 'service-worker.js',
      path: path.resolve(__dirname, 'public'),
    };
  }
  return config;
};
