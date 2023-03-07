const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// const htmlPlugin = require('html-webpack-plugin');
// const cleanPlugin = require('clean-webpack-plugin');
// const ErrorOverlayPlugin = require('error-overlay-webpack-plugin')

const bundleAnalyzerOptions = {
  analyzerHost: '10.0.0.190',
};

let config = {
  context: path.resolve(__dirname, 'src'),
  entry: './index.ts',
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
    fallback: {'url': require.resolve('url/')},
  },
  output: {
    filename: 'js/bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
  // plugins: [new ErrorOverlayPlugin()],
  plugins: [
  ],
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
      '.linux.test',
    ],
    // overlay: true,
    static: 'public',
  },
};

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    config = {...config, ...devConfig};
  } else {
    config.mode = 'production';
  }
  if (argv.mode === 'analyze') {
    // This starts a webserver, so shouldn't be run from a build command.
    const analyzer = new BundleAnalyzerPlugin(bundleAnalyzerOptions);
    config.plugins = [...(config.plugins ?? []), analyzer];
  }
  if (env && env.sw) {
    config.context = __dirname + '/sw-src',
    config.entry = './service-worker.ts',
    config.output = {
      filename: 'service-worker.js',
      path: path.resolve(__dirname, 'public'),
    };
  }
  return config;
};
